import {
  isReservedReviewAuthor,
  normalizeReviewAuthor,
} from "./review-identity.js";

const FIREBASE_CONFIG = Object.freeze({
  apiKey: "AIzaSyCbCgCRWV4cIDjfGg0llNQXzIscnKvLc9w",
  authDomain: "vile-tempest-reviews.firebaseapp.com",
  projectId: "vile-tempest-reviews",
  storageBucket: "vile-tempest-reviews.firebasestorage.app",
  messagingSenderId: "1047163835896",
  appId: "1:1047163835896:web:93edcc036534ee83f6720d",
  measurementId: "G-DPQHEETQZR",
});

const FIREBASE_SDK_VERSION = "13.1.0";
const FIREBASE_APP_NAME = "portfolio-community-reviews";
const REVIEW_COLLECTION = "site_reviews";
const USERNAME_REGISTRY_ANCHOR_FIELD = "usernameRegistryAnchor";
const USERNAME_REGISTRY_FIELD = "usernameRegistry";

let firebasePromise;
let usernameRegistryRefPromise;

function getFirebase() {
  if (!firebasePromise) {
    firebasePromise = Promise.all([
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`
      ),
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`
      ),
    ])
      .then(([appModule, firestore]) => {
        const app =
          appModule.getApps().find((entry) => entry.name === FIREBASE_APP_NAME) ||
          appModule.initializeApp(FIREBASE_CONFIG, FIREBASE_APP_NAME);
        return {
          firestore,
          db: firestore.getFirestore(app),
        };
      })
      .catch((error) => {
        firebasePromise = undefined;
        throw error;
      });
  }

  return firebasePromise;
}

function snapshotReviews(snapshot) {
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...entry.data(),
  }));
}

function timestampValue(review) {
  return review.timestamp?.toMillis?.() || 0;
}

function assertReviewAuthorAllowed(author) {
  if (typeof author !== "string" || !author.trim()) {
    throw new Error("A public review username is required.");
  }
  if (author.trim().length > 80) {
    throw new Error("Review usernames must be 80 characters or fewer.");
  }
  if (isReservedReviewAuthor(author)) {
    throw new Error("Names that impersonate the site owner are not allowed.");
  }
}

async function getUsernameRegistryRef(firestore, db) {
  if (!usernameRegistryRefPromise) {
    usernameRegistryRefPromise = firestore
      .getDocs(firestore.collection(db, REVIEW_COLLECTION))
      .then((snapshot) => {
        const anchors = snapshot.docs.filter(
          (entry) => entry.data()[USERNAME_REGISTRY_ANCHOR_FIELD] === true,
        );
        if (anchors.length !== 1) {
          throw new Error(
            "The review username registry is not initialized. Please try again later.",
          );
        }
        return anchors[0].ref;
      })
      .catch((error) => {
        usernameRegistryRefPromise = undefined;
        throw error;
      });
  }
  return usernameRegistryRefPromise;
}

function createUsernameTakenError() {
  const error = new Error(
    "That username is already in use. Choose another or leave the name blank for a generated username.",
  );
  error.code = "review/username-taken";
  return error;
}

export async function isReviewAuthorAvailable(author, ownerId) {
  if (!ownerId) throw new Error("A review user ID is required.");
  assertReviewAuthorAllowed(author);
  const normalizedAuthor = normalizeReviewAuthor(author);
  if (!normalizedAuthor) throw new Error("A review username is required.");

  const { firestore, db } = await getFirebase();
  const registryRef = await getUsernameRegistryRef(firestore, db);
  const snapshot = await firestore.getDoc(registryRef);
  const registry = snapshot.data()?.[USERNAME_REGISTRY_FIELD] || {};
  const owner = Object.prototype.hasOwnProperty.call(
    registry,
    normalizedAuthor,
  )
    ? registry[normalizedAuthor]
    : null;
  return !owner || owner.ownerId === ownerId;
}

export async function reserveReviewAuthor(author, ownerId) {
  if (!ownerId) throw new Error("A review user ID is required.");
  assertReviewAuthorAllowed(author);
  const normalizedAuthor = normalizeReviewAuthor(author);
  if (!normalizedAuthor) throw new Error("A review username is required.");

  const { firestore, db } = await getFirebase();
  const registryRef = await getUsernameRegistryRef(firestore, db);
  return firestore.runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(registryRef);
    const registry = snapshot.data()?.[USERNAME_REGISTRY_FIELD] || {};
    const currentOwner = Object.prototype.hasOwnProperty.call(
      registry,
      normalizedAuthor,
    )
      ? registry[normalizedAuthor]
      : null;
    if (currentOwner && currentOwner.ownerId !== ownerId) {
      throw createUsernameTakenError();
    }
    if (currentOwner) return false;

    transaction.update(registryRef, {
      [USERNAME_REGISTRY_FIELD]: {
        ...registry,
        [normalizedAuthor]: {
          author: author.trim(),
          ownerId,
        },
      },
    });
    return true;
  });
}

export async function releaseReviewAuthor(author, ownerId) {
  if (!author || !ownerId) return;
  const normalizedAuthor = normalizeReviewAuthor(author);
  if (!normalizedAuthor) return;

  const { firestore, db } = await getFirebase();
  const registryRef = await getUsernameRegistryRef(firestore, db);
  await firestore.runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(registryRef);
    const registry = snapshot.data()?.[USERNAME_REGISTRY_FIELD] || {};
    if (
      !Object.prototype.hasOwnProperty.call(registry, normalizedAuthor) ||
      registry[normalizedAuthor]?.ownerId !== ownerId
    ) {
      return;
    }

    const updatedRegistry = { ...registry };
    delete updatedRegistry[normalizedAuthor];
    transaction.update(registryRef, {
      [USERNAME_REGISTRY_FIELD]: updatedRegistry,
    });
  });
}

export async function getReviewsByDeviceToken(deviceToken) {
  if (!deviceToken) throw new Error("A review device ID is required.");
  const { firestore, db } = await getFirebase();
  const result = await firestore.getDocs(
    firestore.query(
      firestore.collection(db, REVIEW_COLLECTION),
      firestore.where("deviceToken", "==", deviceToken),
    ),
  );
  const reviews = snapshotReviews(result).sort(
    (first, second) => timestampValue(second) - timestampValue(first),
  );
  return reviews;
}

export async function findReviewByDeviceToken(deviceToken, reviewTargetId) {
  if (!deviceToken) throw new Error("A review device ID is required.");
  if (!reviewTargetId) throw new Error("A review target ID is required.");
  const { firestore, db } = await getFirebase();
  const documentId = `v2_${encodeURIComponent(deviceToken)}__${encodeURIComponent(reviewTargetId)}`;
  const snapshot = await firestore.getDoc(
    firestore.doc(db, REVIEW_COLLECTION, documentId),
  );
  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
}

export async function saveReview(data) {
  if (!data.userId || !data.reviewTargetId) {
    throw new Error("A review user ID and target ID are required.");
  }
  assertReviewAuthorAllowed(data.author);

  const { firestore, db } = await getFirebase();
  const documentId = `v2_${encodeURIComponent(data.userId)}__${encodeURIComponent(data.reviewTargetId)}`;
  const reviewRef = firestore.doc(db, REVIEW_COLLECTION, documentId);
  await firestore.setDoc(reviewRef, data, { merge: true });
  return { id: reviewRef.id };
}

export async function synchronizeReviewAuthor(deviceToken, author) {
  if (!deviceToken) throw new Error("A review device ID is required.");
  assertReviewAuthorAllowed(author);
  const { firestore, db } = await getFirebase();
  const result = await firestore.getDocs(
    firestore.query(
      firestore.collection(db, REVIEW_COLLECTION),
      firestore.where("deviceToken", "==", deviceToken),
    ),
  );
  const changedReviews = result.docs.filter(
    (review) => review.data().author !== author,
  );

  for (let offset = 0; offset < changedReviews.length; offset += 450) {
    const batch = firestore.writeBatch(db);
    changedReviews
      .slice(offset, offset + 450)
      .forEach((review) => batch.update(review.ref, { author }));
    await batch.commit();
  }
}

export async function addReview(data) {
  assertReviewAuthorAllowed(data.author);
  const { firestore, db } = await getFirebase();
  return firestore.addDoc(
    firestore.collection(db, REVIEW_COLLECTION),
    data,
  );
}

export async function updateReview(reviewId, data) {
  if (Object.prototype.hasOwnProperty.call(data, "author")) {
    assertReviewAuthorAllowed(data.author);
  }
  const { firestore, db } = await getFirebase();
  return firestore.updateDoc(
    firestore.doc(db, REVIEW_COLLECTION, reviewId),
    data,
  );
}

export async function subscribeToReviews(onReviews, onError) {
  const { firestore, db } = await getFirebase();
  const reviewQuery = firestore.query(
    firestore.collection(db, REVIEW_COLLECTION),
    firestore.orderBy("timestamp", "desc"),
  );

  return firestore.onSnapshot(
    reviewQuery,
    (snapshot) => onReviews(snapshotReviews(snapshot)),
    onError,
  );
}
