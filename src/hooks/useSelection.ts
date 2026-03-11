import { useState, useCallback, useRef } from 'react';
import { Selection } from '../types';

interface UseSelectionReturn {
  selection: Selection;
  isSelecting: boolean;
  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  endSelection: () => void;
  setSelection: (selection: Selection) => void;
  clearSelection: () => void;
}

export function useSelection(): UseSelectionReturn {
  const [selection, setSelectionState] = useState<Selection>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const startSelection = useCallback((x: number, y: number) => {
    startPosRef.current = { x, y };
    setSelectionState({
      x,
      y,
      width: 0,
      height: 0,
    });
    setIsSelecting(true);
  }, []);

  const updateSelection = useCallback((x: number, y: number) => {
    if (!isSelecting) return;

    const startX = startPosRef.current.x;
    const startY = startPosRef.current.y;

    let newX = Math.min(x, startX);
    let newY = Math.min(y, startY);
    let newWidth = Math.abs(x - startX);
    let newHeight = Math.abs(y - startY);

    setSelectionState({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [isSelecting]);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const setSelection = useCallback((newSelection: Selection) => {
    setSelectionState(newSelection);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  }, []);

  return {
    selection,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    setSelection,
    clearSelection,
  };
}
