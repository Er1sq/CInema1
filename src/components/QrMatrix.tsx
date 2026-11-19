interface QrMatrixProps {
  code: string;
  size?: number;
}

export function QrMatrix({ code, size = 88 }: QrMatrixProps) {
  const cells = 11;
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const rects: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const isCornerFinder =
        (x < 3 && y < 3) || (x >= cells - 3 && y < 3) || (x < 3 && y >= cells - 3);
      if (isCornerFinder) {
        const inInner =
          (x === 1 && y === 1) ||
          (x === cells - 2 && y === 1) ||
          (x === 1 && y === cells - 2);
        const onOuter =
          x === 0 ||
          y === 0 ||
          x === 2 ||
          y === 2 ||
          x === cells - 1 ||
          x === cells - 3 ||
          y === cells - 1 ||
          y === cells - 3;
        if (inInner || onOuter) {
          rects.push({ x, y });
        }
        continue;
      }

      const bit = ((hash >>> ((x * 7 + y * 13) % 24)) ^ (x * 3 + y * 5)) & 1;
      if (bit === 1) {
        rects.push({ x, y });
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      role="img"
      aria-label={`QR-код билета ${code}`}
      className="bg-[#F4F4F5] p-1.5 rounded-md shrink-0"
    >
      {rects.map((cell, idx) => (
        <rect key={idx} x={cell.x} y={cell.y} width={0.92} height={0.92} fill="#0B0C0E" />
      ))}
    </svg>
  );
}
