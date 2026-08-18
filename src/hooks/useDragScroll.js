import { useRef, useEffect } from 'react';

export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startY = 0;
    let startX = 0;
    let scrollTop = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e) => {
      // Only activate on Left Mouse Button (0)
      if (e.button !== 0) return;
      
      isDown = true;
      el.style.userSelect = 'none'; // Prevent text highlighting while dragging
      
      startX = e.pageX - el.offsetLeft;
      startY = e.pageY - el.offsetTop;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
    };

    const handleMouseLeave = () => {
      isDown = false;
      el.style.userSelect = '';
    };

    const handleMouseUp = () => {
      isDown = false;
      el.style.userSelect = '';
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault(); // Stops browser from trying to drag images/links
      
      const x = e.pageX - el.offsetLeft;
      const y = e.pageY - el.offsetTop;
      
      // Calculate distance moved (multiply by 1.5 for slight acceleration)
      const walkX = (x - startX) * 1.5; 
      const walkY = (y - startY) * 1.5;
      
      el.scrollLeft = scrollLeft - walkX;
      el.scrollTop = scrollTop - walkY;
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mousemove', handleMouseMove);

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
}