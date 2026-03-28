import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'

let detector = null

export async function loadDetector() {
    await tf.ready()
    if (detector) return detector

    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true,
        }
    )
    console.log('✅ MoveNet detector loaded')
    return detector
}

export async function detectPose(videoElement) {
    if (!detector) await loadDetector()
    const poses = await detector.estimatePoses(videoElement)
    if (!poses || poses.length === 0) return null
    return poses[0]
}

// ── Get key points from pose ──────────────────────
export function getKeyPoints(pose) {
    if (!pose?.keypoints) return null

    const kp = {}
    pose.keypoints.forEach(point => {
        kp[point.name] = {
            x:          point.x,
            y:          point.y,
            confidence: point.score
        }
    })
    return kp
}

// ── Calculate outfit placement from keypoints ─────
export function calculatePlacement(keypoints, canvasWidth, canvasHeight) {
    const ls  = keypoints['left_shoulder']
    const rs  = keypoints['right_shoulder']
    const lh  = keypoints['left_hip']
    const rh  = keypoints['right_hip']
    const lk  = keypoints['left_knee']
    const rk  = keypoints['right_knee']
    const lank = keypoints['left_ankle']
    const rank = keypoints['right_ankle']

    if (!ls || !rs || !lh || !rh) return null

    // ── Confidence check ──────────────────────────
    if (ls.confidence < 0.3 || rs.confidence < 0.3) return null

    // ── Shoulder measurements ─────────────────────
    const shoulderWidth   = Math.abs(ls.x - rs.x)
    const shoulderCenterX = (ls.x + rs.x) / 2
    const shoulderY       = (ls.y + rs.y) / 2

    // ── Hip measurements ──────────────────────────
    const hipWidth        = Math.abs(lh.x - rh.x)
    const hipCenterX      = (lh.x + rh.x) / 2
    const hipY            = (lh.y + rh.y) / 2

    // ── Knee + ankle ──────────────────────────────
    const kneeY   = lk && rk ? (lk.y + rk.y) / 2 : hipY + 120
    const ankleY  = lank && rank ? (lank.y + rank.y) / 2 : kneeY + 120

    // ── TOP placement ─────────────────────────────
    const topWidth   = shoulderWidth * 1.35
    const topHeight  = (hipY - shoulderY) * 1.15
    const topX       = shoulderCenterX - topWidth / 2
    const topY       = shoulderY - topHeight * 0.08

    // ── BOTTOM placement ──────────────────────────
    const bottomWidth  = Math.max(hipWidth * 1.4, shoulderWidth * 1.1)
    const bottomHeight = (ankleY - hipY) * 1.05
    const bottomX      = hipCenterX - bottomWidth / 2
    const bottomY      = hipY - topHeight * 0.02

    return {
        top: {
            x:      topX,
            y:      topY,
            width:  topWidth,
            height: topHeight,
        },
        bottom: {
            x:      bottomX,
            y:      bottomY,
            width:  bottomWidth,
            height: bottomHeight,
        },
        shoulders: { ls, rs, centerX: shoulderCenterX, y: shoulderY },
        hips:      { lh, rh, centerX: hipCenterX, y: hipY },
    }
}