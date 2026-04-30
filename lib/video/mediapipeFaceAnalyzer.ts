import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type VideoAnalysisStats = {
  framesAnalyzed: number;
  faceDetectedFrames: number;
  lookingAwayFrames: number;
  smileFrames: number;

  eyeContactPercent: number;
  faceDetectedPercent: number;
  lookingAwayPercent: number;
  lookingAwayCount: number; // kept so old UI/API does not break
  avgSmileScore: number;
};

let faceLandmarker: FaceLandmarker | null = null;

export async function initFaceAnalyzer() {
  if (typeof window === "undefined") {
    throw new Error("MediaPipe can only run in the browser.");
  }

  if (faceLandmarker) return faceLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
  });

  return faceLandmarker;
}

export function createEmptyVideoStats(): VideoAnalysisStats {
  return {
    framesAnalyzed: 0,
    faceDetectedFrames: 0,
    lookingAwayFrames: 0,
    smileFrames: 0,

    eyeContactPercent: 0,
    faceDetectedPercent: 0,
    lookingAwayPercent: 0,
    lookingAwayCount: 0,
    avgSmileScore: 0,
  };
}

export function analyzeFrame(
  result: FaceLandmarkerResult,
  stats: VideoAnalysisStats
): VideoAnalysisStats {
  const next = { ...stats };
  next.framesAnalyzed += 1;

  const landmarks = result.faceLandmarks?.[0];
  const blendshapes = result.faceBlendshapes?.[0]?.categories || [];

  if (!landmarks) {
    return calculatePercentages(next);
  }

  next.faceDetectedFrames += 1;

  /**
   * Simple MVP gaze estimate.
   * We are NOT doing true eye tracking yet.
   * This estimates whether the face/nose is centered in the camera frame.
   */
  const nose = landmarks[1];

  // Less sensitive than before.
  // Before: 0.38 / 0.62 was too strict.
  const lookingAway = nose.x < 0.3 || nose.x > 0.7;

  if (lookingAway) {
    next.lookingAwayFrames += 1;
  }

  const smileLeft =
    blendshapes.find((b) => b.categoryName === "mouthSmileLeft")?.score || 0;

  const smileRight =
    blendshapes.find((b) => b.categoryName === "mouthSmileRight")?.score || 0;

  const smileScore = (smileLeft + smileRight) / 2;

  if (smileScore > 0.35) {
    next.smileFrames += 1;
  }

  next.avgSmileScore =
    (next.avgSmileScore * (next.framesAnalyzed - 1) + smileScore) /
    next.framesAnalyzed;

  return calculatePercentages(next);
}

function calculatePercentages(stats: VideoAnalysisStats): VideoAnalysisStats {
  if (stats.framesAnalyzed === 0) return stats;

  const eyeContactFrames = Math.max(
    0,
    stats.faceDetectedFrames - stats.lookingAwayFrames
  );

  const faceDetectedPercent = Math.round(
    (stats.faceDetectedFrames / stats.framesAnalyzed) * 100
  );

  const eyeContactPercent = Math.round(
    (eyeContactFrames / stats.framesAnalyzed) * 100
  );

  const lookingAwayPercent = Math.round(
    (stats.lookingAwayFrames / stats.framesAnalyzed) * 100
  );

  return {
    ...stats,
    faceDetectedPercent,
    eyeContactPercent,
    lookingAwayPercent,

    // Backward compatible.
    // Now this means percent, not raw frame count.
    lookingAwayCount: lookingAwayPercent,
  };
}