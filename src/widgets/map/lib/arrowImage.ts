const SIZE = 32

export function drawArrowImage(): ImageData | null {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#1f2933'
  context.beginPath()
  context.moveTo(SIZE / 2, 2)
  context.lineTo(SIZE - 7, SIZE / 2)
  context.lineTo(SIZE / 2 + 3, SIZE / 2)
  context.lineTo(SIZE / 2 + 3, SIZE - 2)
  context.lineTo(SIZE / 2 - 3, SIZE - 2)
  context.lineTo(SIZE / 2 - 3, SIZE / 2)
  context.lineTo(7, SIZE / 2)
  context.closePath()
  context.fill()
  return context.getImageData(0, 0, SIZE, SIZE)
}
