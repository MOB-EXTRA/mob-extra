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

let firebasePromise;

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
  if (!reviewTargetId) throw new Error("A review target ID is required.");
  const reviews = await getReviewsByDeviceToken(deviceToken);
  return reviews.find((review) => review.reviewTargetId === reviewTargetId) || null;
}

export async function saveReview(data) {
  if (!data.userId || !data.reviewTargetId) {
    throw new Error("A review user ID and target ID are required.");
  }

  const { firestore, db } = await getFirebase();
  const documentId = `v2_${encodeURIComponent(data.userId)}__${encodeURIComponent(data.reviewTargetId)}`;
  const reviewRef = firestore.doc(db, REVIEW_COLLECTION, documentId);
  await firestore.setDoc(reviewRef, data, { merge: true });
  return { id: reviewRef.id };
}

export async function synchronizeReviewAuthor(deviceToken, author) {
  if (!deviceToken) throw new Error("A review device ID is required.");
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
  const { firestore, db } = await getFirebase();
  return firestore.addDoc(
    firestore.collection(db, REVIEW_COLLECTION),
    data,
  );
}

export async function updateReview(reviewId, data) {
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
