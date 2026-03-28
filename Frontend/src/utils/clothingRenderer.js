const imageCache = {}

// ── Load image with transparency support ──────────
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (imageCache[url]) {
            resolve(imageCache[url])
            return
        }
        const img       = new Image()
        img.crossOrigin = 'anonymous'
        img.onload  = () => {
            imageCache[url] = img
            resolve(img)
        }
        img.onerror = reject
        img.src     = url
    })
}

// ── Draw clothing with transparency ───────────────
export function drawClothing(ctx, img, placement, options = {}) {
    const { x, y, width, height } = placement
    const { opacity = 0.92 } = options

    if (!img || width <= 0 || height <= 0) return

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.drawImage(img, x, y, width, height)
    ctx.restore()
}

// ── Draw skeleton ─────────────────────────────────
export function drawSkeleton(ctx, keypoints) {
    const connections = [
        ['left_shoulder',  'right_shoulder'],
        ['left_shoulder',  'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip',       'right_hip'],
        ['left_shoulder',  'left_elbow'],
        ['right_shoulder', 'right_elbow'],
        ['left_hip',       'left_knee'],
        ['right_hip',      'right_knee'],
        ['left_knee',      'left_ankle'],
        ['right_knee',     'right_ankle'],
    ]

    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth   = 2
    ctx.globalAlpha = 0.8

    connections.forEach(([a, b]) => {
        const ptA = keypoints[a]
        const ptB = keypoints[b]
        if (!ptA || !ptB) return
        if (ptA.confidence < 0.3 || ptB.confidence < 0.3) return
        ctx.beginPath()
        ctx.moveTo(ptA.x, ptA.y)
        ctx.lineTo(ptB.x, ptB.y)
        ctx.stroke()
    })

    Object.values(keypoints).forEach(pt => {
        if (pt.confidence < 0.3) return
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#a78bfa'
        ctx.globalAlpha = 1
        ctx.fill()
    })

    ctx.globalAlpha = 1
}

export function drawPlacementBoxes(ctx, placement) {
    ctx.strokeStyle = 'rgba(124,58,237,0.5)'
    ctx.lineWidth   = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(
        placement.top.x, placement.top.y,
        placement.top.width, placement.top.height
    )
    ctx.strokeRect(
        placement.bottom.x, placement.bottom.y,
        placement.bottom.width, placement.bottom.height
    )
    ctx.setLineDash([])
}

// ── Smoother ──────────────────────────────────────
export class Smoother {
    constructor(smoothing = 0.72) {
        this.smoothing = smoothing
        this.values    = {}
    }
    smooth(key, val) {
        if (this.values[key] === undefined) {
            this.values[key] = val
        } else {
            this.values[key] = this.values[key] * this.smoothing
                             + val * (1 - this.smoothing)
        }
        return this.values[key]
    }
    smoothPlacement(p) {
        if (!p) return null
        return {
            top: {
                x:      this.smooth('tx', p.top.x),
                y:      this.smooth('ty', p.top.y),
                width:  this.smooth('tw', p.top.width),
                height: this.smooth('th', p.top.height),
            },
            bottom: {
                x:      this.smooth('bx', p.bottom.x),
                y:      this.smooth('by', p.bottom.y),
                width:  this.smooth('bw', p.bottom.width),
                height: this.smooth('bh', p.bottom.height),
            },
            shoulders: p.shoulders,
            hips:      p.hips,
        }
    }
}