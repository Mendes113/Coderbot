import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  duration?: number;
  onComplete?: () => void;
}

/**
 * Componente de animação Matrix Rain para efeitos especiais tech
 */
export const MatrixRain: React.FC<MatrixRainProps> = ({ 
  duration = 3000, 
  onComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas para tela inteira
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Caracteres Matrix (katakana + números + símbolos)
    const matrix = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const characters = matrix.split('');

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    
    // Array para armazenar a posição Y de cada coluna
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Começar fora da tela
    }

    const startTime = Date.now();

    function draw() {
      if (!ctx || !canvas) return;

      // Fundo semi-transparente para efeito de trilha
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Texto verde Matrix
      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Caractere aleatório
        const text = characters[Math.floor(Math.random() * characters.length)];
        
        // Desenhar caractere
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset quando chega ao fim da tela + pequeno delay aleatório
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      // Verificar duração
      if (Date.now() - startTime < duration) {
        animationRef.current = requestAnimationFrame(draw);
      } else {
        onComplete?.();
      }
    }

    // Iniciar animação
    animationRef.current = requestAnimationFrame(draw);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
    />
  );
};
