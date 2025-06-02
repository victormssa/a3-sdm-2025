import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useCallback, useEffect } from "react";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
};

export const HandleChangeComponent = () => {
    const [isPasswordRecover, setIsPasswordRecover] = useState(false);
    const [isPasswordRecover2, setIsPasswordRecover2] = useState(false);

    const handleChangeComponent = () => {
        setIsPasswordRecover(!isPasswordRecover);
    };

    const handleChangeComponent2 = () => {
        setIsPasswordRecover2(!isPasswordRecover2);
    };

    return { handleChangeComponent, handleChangeComponent2, isPasswordRecover, isPasswordRecover2 };
};



  export const useAsideExpand = () => {
    const [isExpanded, setExpand] = useState(false);
  
    const handleAsideExpantion = () => {
      setExpand(prevState => !prevState);
    }
  
    return { handleAsideExpantion, isExpanded };
  }

{/* ------------------------TOOLTIPS HOOKS------------------------------*/}


interface TooltipData {
  content: string;
  index: number;
  link?: string; // Adicionado para o link opcional
}


export const useTooltip = () => {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const handleShowTooltip = useCallback((content: string, index: number, link?: string) => {
    setTooltipData({ content, index, link });
  }, []);
  

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const tooltipElement = document.querySelector('.tooltip-container');
    if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
      setTooltipData(null);
    }
  }, []);

  useEffect(() => {
    if (tooltipData) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [tooltipData, handleClickOutside]);

  return { tooltipData, handleShowTooltip, setTooltipData };
};
