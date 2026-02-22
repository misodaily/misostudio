// ── Template → Runway prompt mapping ───────────────────────────────────────

const TEMPLATE_PROMPTS: Record<string, string> = {
  ignite:
    'Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a compact lightsaber hilt is in the grip (mostly hidden): brushed aluminum machining lines, black rubber grip panels, tiny screws, subtle edge wear, micro-scratches. At 0.5s the blade ignites instantly and the person performs a clear saber combo: fast diagonal slash (top-right to bottom-left), quick reverse slash (bottom-left to top-right), then one short forward thrust, finishing in a stable guard stance. Add glow, bloom, and light spill on knuckles, sleeve, and clothing; slight moving shadows across the torso. Use PBR reflections on the hilt. Motion blur ONLY on blade and moving arms. Background perfectly still; face identical, no morphing. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.',

  flare:
    'Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a flame dagger forms instantly: forged steel core with ember edge glow, dark leather-wrapped handle, small brass pommel, tiny scuffs. The person performs a clear blade combo: one fast downward slash, one quick upward reverse slash, then a short forward feint that stops, finishing with the dagger held forward in guard. Flames flicker in controlled patterns that cling to the blade (no spreading fire); add warm light spill on hand, sleeve, and chest, plus subtle heat shimmer near the blade only. Use PBR reflections on steel and brass. Motion blur ONLY on blade/flames and moving arms. Background perfectly still; face identical, no morphing. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.',

  firework:
    "Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a compact handheld party popper (firework-style confetti popper) appears in the person's hand: short cylindrical tube with a paper-wrapped body, festive printed label, crimped metallic foil top, small pull-string at the base, visible seam lines, tiny scuffs, and a textured grip. The person performs one clear action: they raise the popper slightly and yank the pull-string once. The popper pops and shoots a bright burst of confetti and a few curled paper streamers upward in a tight cone, like a mini firework celebration, then the pieces slow and drift down naturally for the remainder of the clip. Confetti is a realistic paper + foil mix with fluttering physics; streamers curl and rotate gently. Add subtle light reflections from foil pieces onto the fingers and sleeve, and a brief sparkle glint at the pop moment (no smoke, no flame). Soft motion blur only on confetti/streamers and the moving hand. Keep the rest of the body minimal; face identical with no morphing. Background perfectly still, unchanged. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.",

  bubblegun:
    "Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a cute bubble gun appears in the person's hand: pastel plastic casing, small trigger, clear bubble solution chamber with liquid slosh, minor scratches. The person performs one clear action: they raise the bubble gun and squeeze the trigger once, producing a short stream of 12–20 soap bubbles that float upward and slightly sideways with gentle wobble. Bubbles have realistic thin-film iridescence, reflections of the environment, and soft highlights; motion blur only on bubbles and the moving hand. Keep body motion minimal; face identical, no morphing. Background perfectly still, unchanged. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.",

  moneygun:
    "Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a money gun appears in the person's hand: matte black polymer body, visible screws, small safety switch, and a transparent magazine showing stacked paper bills (generic, non-identifiable currency). The person performs one clear action: they pull the trigger once and the gun fires a short burst of 8–15 bills that flutter forward, spin, and fall with realistic paper physics. Add subtle reflections and shadows on the bills; slight light spill on fingers from the moving paper. Motion blur only on bills and moving hand. Keep body motion minimal; face identical with no morphing. Background perfectly still, unchanged. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.",

  toyhammer:
    "Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a toy squeaky hammer appears in the person's hand: bright plastic head, soft rubbery surface, visible molding seams, slightly glossy highlights, and a textured handle. The person performs one clear action: one gentle downward bonk motion (no real impact on objects), then holds the hammer still. Add subtle squash feel to the rubber head during the bonk, with soft motion blur only on the hammer and moving hand. Keep body motion minimal; face identical, no morphing. Background perfectly still, unchanged. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.",

  magicshow:
    "Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then a magic wand appears in the person's hand: polished dark wood with carved grooves, small brass tip, subtle wear, realistic reflections. The person performs one clear action: they flick the wand once with a confident gesture. Instead of a big spell, a tiny puff of gray smoke and a few weak sparkles pop out at the wand tip, then quickly fade—like a comedic failed magic trick. Keep effects small and clean; do not fill the frame. Add a faint warm highlight on fingers from the brief spark. Motion blur only on wand and moving hand. Body minimal; face identical, no morphing. Background perfectly still, unchanged. No camera movement, no zoom, no cuts, no scene change, no extra people, no text. Total 5 seconds.",
}

const DEFAULT_PROMPT =
  'Photorealistic iPhone Live Photo style, keep the exact background and the person identical to the source photo. Start with 0.5s perfectly frozen frame. Then subtle natural motion: a small breath, slight shoulder movement. Cinematic atmospheric effects appear around the person — soft light and subtle motion fill the scene. No camera movement, no zoom, no cuts, no background change, no face morphing, no extra people, no text. 5 seconds.'

export function getTemplatePrompt(templateId: string): string {
  return TEMPLATE_PROMPTS[templateId] ?? DEFAULT_PROMPT
}

// ── API 설정 ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.dev.runwayml.com/v1'
const RUNWAY_VERSION = '2024-11-06'

function getHeaders() {
  const apiKey = process.env.RUNWAYML_API_SECRET
  if (!apiKey) throw new Error('RUNWAYML_API_SECRET is not set')
  return {
    'Authorization': `Bearer ${apiKey}`,
    'X-Runway-Version': RUNWAY_VERSION,
    'Content-Type': 'application/json',
  }
}

// ── Start generation ────────────────────────────────────────────────────────

export async function startRunwayTask(params: {
  sourceImageUrl: string
  templateId: string
  durationSec: number
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/image_to_video`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: params.sourceImageUrl,
      promptText: getTemplatePrompt(params.templateId),
      ratio: '1280:720',
      duration: 5,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Runway API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.id
}

// ── Poll task status ────────────────────────────────────────────────────────

export type RunwayTaskResult = {
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  progress: number
  videoUrl?: string
  errorMessage?: string
}

export async function getRunwayTaskStatus(
  taskId: string,
  startedAt: string,
): Promise<RunwayTaskResult> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Runway API error ${res.status}: ${err}`)
  }

  const task = await res.json()
  console.log('[runway] task response:', JSON.stringify(task))

  const elapsedSec = (Date.now() - new Date(startedAt).getTime()) / 1000

  // Estimate progress from elapsed time — Runway doesn't expose granular progress
  function estimateProgress(): number {
    if (elapsedSec < 10) return Math.floor(10 + (elapsedSec / 10) * 15)
    if (elapsedSec < 30) return Math.floor(25 + ((elapsedSec - 10) / 20) * 30)
    if (elapsedSec < 60) return Math.floor(55 + ((elapsedSec - 30) / 30) * 25)
    return Math.min(92, Math.floor(80 + ((elapsedSec - 60) / 120) * 12))
  }

  const status = (task.status ?? '').toUpperCase()

  switch (status) {
    case 'PENDING':
    case 'THROTTLED':
      return { status: 'pending', progress: Math.min(estimateProgress(), 20) }

    case 'RUNNING': {
      const actualProgress = typeof task.progress === 'number'
        ? Math.floor(task.progress * 100)
        : null
      const progress = actualProgress ?? Math.max(estimateProgress(), 30)
      return { status: 'running', progress: Math.min(progress, 95) }
    }

    case 'SUCCEEDED': {
      const output = task.output ?? task.outputs ?? task.artifacts
      const videoUrl = Array.isArray(output)
        ? (output as string[])[0]
        : typeof output === 'string'
          ? output
          : undefined
      console.log('[runway] succeeded, videoUrl:', videoUrl)
      if (!videoUrl) {
        console.error('[runway] SUCCEEDED but no videoUrl. Full response:', JSON.stringify(task))
      }
      return { status: 'succeeded', progress: 100, videoUrl }
    }

    case 'FAILED':
      return {
        status: 'failed',
        progress: 0,
        errorMessage: task.failure ?? task.error ?? task.message ?? '영상 생성에 실패했습니다.',
      }

    case 'CANCELLED':
      return {
        status: 'failed',
        progress: 0,
        errorMessage: '영상 생성이 취소되었습니다.',
      }

    default:
      console.log('[runway] unknown status:', task.status, '| full response:', JSON.stringify(task))
      return { status: 'pending', progress: estimateProgress() }
  }
}
