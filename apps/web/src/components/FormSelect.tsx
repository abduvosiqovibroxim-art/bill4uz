"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

const MOBILE_BREAKPOINT = 767;
const DESKTOP_VIEWPORT_PADDING = 12;
const DESKTOP_MENU_GAP = 8;

interface DesktopMenuPosition {
  left: number;
  maxHeight: number;
  openDirection: "down" | "up";
  top?: number;
  bottom?: number;
  width: number;
}

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

interface SelectChangeEvent {
  target: {
    value: string;
    name?: string;
  };
  currentTarget: {
    value: string;
    name?: string;
  };
}

interface FormSelectProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onChange?: (event: SelectChangeEvent) => void;
  placeholder?: string;
  required?: boolean;
  title?: string;
  value?: string | number | readonly string[];
}

export function FormSelect({
  children,
  className = "",
  disabled = false,
  id,
  name,
  onBlur,
  onChange,
  placeholder,
  required = false,
  title,
  value
}: FormSelectProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [desktopMenuPosition, setDesktopMenuPosition] = useState<DesktopMenuPosition | null>(null);
  const options = useMemo(() => extractOptions(children), [children]);
  const normalizedValue = normalizeSelectValue(value);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === normalizedValue),
    0
  );
  const selectedOption = options[selectedIndex] ?? null;
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedLabel = selectedOption?.label ?? placeholder ?? t("forms.selectOption");
  const menuTitle = title ?? placeholder ?? t("forms.selectOption");

  const syncViewport = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
  }, []);

  const updateDesktopMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(rect.width, viewportWidth - DESKTOP_VIEWPORT_PADDING * 2);
    const left = clamp(
      rect.left,
      DESKTOP_VIEWPORT_PADDING,
      Math.max(DESKTOP_VIEWPORT_PADDING, viewportWidth - width - DESKTOP_VIEWPORT_PADDING)
    );
    const availableBelow = viewportHeight - rect.bottom - DESKTOP_MENU_GAP - DESKTOP_VIEWPORT_PADDING;
    const availableAbove = rect.top - DESKTOP_MENU_GAP - DESKTOP_VIEWPORT_PADDING;
    const openDirection =
      availableBelow < 220 && availableAbove > availableBelow ? "up" : "down";
    const preferredHeight = openDirection === "up" ? availableAbove : availableBelow;

    setDesktopMenuPosition({
      left,
      width,
      maxHeight: Math.max(96, Math.floor(preferredHeight)),
      openDirection,
      top: openDirection === "down" ? rect.bottom + DESKTOP_MENU_GAP : undefined,
      bottom: openDirection === "up" ? viewportHeight - rect.top + DESKTOP_MENU_GAP : undefined
    });
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, [isMounted, syncViewport]);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen || isMobileViewport) {
      return;
    }

    function handlePointer(event: MouseEvent | PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || desktopMenuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointer);

    return () => {
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [isOpen, isMobileViewport]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeMenu();
      buttonRef.current?.focus();
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isMobileViewport || !isMounted) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousDocumentOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isMounted, isMobileViewport, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || isMobileViewport || !isMounted) {
      setDesktopMenuPosition(null);
      return;
    }

    updateDesktopMenuPosition();

    const handleViewportChange = () => {
      syncViewport();
      updateDesktopMenuPosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", updateDesktopMenuPosition, true);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && buttonRef.current) {
      observer = new ResizeObserver(() => {
        updateDesktopMenuPosition();
      });
      observer.observe(buttonRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", updateDesktopMenuPosition, true);
      observer?.disconnect();
    };
  }, [isMounted, isMobileViewport, isOpen, syncViewport, updateDesktopMenuPosition]);

  function emitChange(nextValue: string) {
    if (!onChange) {
      return;
    }

    onChange({
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name }
    });
  }

  function openMenu() {
    if (disabled || options.length === 0) {
      return;
    }

    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  function handleSelect(index: number) {
    const option = options[index];

    if (!option || option.disabled || disabled) {
      return;
    }

    emitChange(option.value);
    closeMenu();
    buttonRef.current?.focus();
  }

  function moveActive(step: 1 | -1) {
    if (!options.length) {
      return;
    }

    let nextIndex = activeIndex;

    for (let attempt = 0; attempt < options.length; attempt += 1) {
      nextIndex = (nextIndex + step + options.length) % options.length;
      if (!options[nextIndex]?.disabled) {
        setActiveIndex(nextIndex);
        return;
      }
    }
  }

  function moveToBoundary(boundary: "start" | "end") {
    const orderedIndexes =
      boundary === "start"
        ? options.map((_, index) => index)
        : options.map((_, index) => index).reverse();

    const nextIndex = orderedIndexes.find((index) => !options[index]?.disabled);
    if (typeof nextIndex === "number") {
      setActiveIndex(nextIndex);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          openMenu();
          return;
        }
        moveActive(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          openMenu();
          return;
        }
        moveActive(-1);
        return;
      case "Home":
        if (isOpen) {
          event.preventDefault();
          moveToBoundary("start");
        }
        return;
      case "End":
        if (isOpen) {
          event.preventDefault();
          moveToBoundary("end");
        }
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!isOpen) {
          openMenu();
          return;
        }
        handleSelect(activeIndex);
        return;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          closeMenu();
          buttonRef.current?.focus();
        }
        return;
      case "Tab":
        closeMenu();
        return;
      default:
        return;
    }
  }

  function renderOptions() {
    return options.map((option, index) => {
      const isSelected = option.value === normalizedValue;
      const isActive = index === activeIndex;

      return (
        <button
          key={option.value || `empty-${index}`}
          ref={(node) => {
            optionRefs.current[index] = node;
          }}
          type="button"
          role="option"
          aria-selected={isSelected}
          disabled={option.disabled}
          className={`custom-select-option ${
            isSelected ? "custom-select-option-selected" : ""
          } ${isActive ? "custom-select-option-active" : ""} ${
            option.disabled ? "custom-select-option-disabled" : ""
          }`.trim()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => handleSelect(index)}
        >
          <span>{option.label}</span>
          {isSelected ? <span className="custom-select-check">{"\u2713"}</span> : null}
        </button>
      );
    });
  }

  const desktopMenuStyle: CSSProperties | undefined = desktopMenuPosition
    ? {
        left: desktopMenuPosition.left,
        width: desktopMenuPosition.width,
        maxHeight: desktopMenuPosition.maxHeight,
        top: desktopMenuPosition.top,
        bottom: desktopMenuPosition.bottom
      }
    : undefined;

  return (
    <div ref={rootRef} className={`custom-select ${className}`.trim()} onKeyDown={handleKeyDown}>
      <input type="hidden" name={name} value={normalizedValue} required={required} />
      <button
        ref={buttonRef}
        id={id}
        type="button"
        title={title}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listId}
        className={`field custom-select-trigger ${isOpen ? "custom-select-trigger-open" : ""}`.trim()}
        onClick={() => {
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onBlur={onBlur}
      >
        <span className={`custom-select-value ${selectedOption ? "" : "custom-select-placeholder"}`.trim()}>
          {selectedLabel}
        </span>
        <span className={`custom-select-chevron ${isOpen ? "custom-select-chevron-open" : ""}`.trim()} aria-hidden="true">
          {"\u25be"}
        </span>
      </button>

      {isOpen && !isMobileViewport && isMounted && desktopMenuPosition
        ? createPortal(
            <div
              ref={desktopMenuRef}
              id={listId}
              role="listbox"
              className={`custom-select-menu custom-select-menu-desktop custom-select-menu-desktop-${desktopMenuPosition.openDirection}`}
              aria-labelledby={id}
              style={desktopMenuStyle}
            >
              {renderOptions()}
            </div>,
            document.body
          )
        : null}

      {isOpen && isMobileViewport && isMounted
        ? createPortal(
            <div className="custom-select-mobile-layer">
              <button
                type="button"
                className="custom-select-mobile-overlay"
                aria-label="Close select menu"
                onClick={() => {
                  closeMenu();
                  buttonRef.current?.focus();
                }}
              />
              <div className="custom-select-mobile-sheet" role="dialog" aria-modal="true" aria-labelledby={`${listId}-title`}>
                <div className="custom-select-mobile-header">
                  <span className="custom-select-mobile-handle" aria-hidden="true" />
                  <p id={`${listId}-title`} className="custom-select-mobile-title">
                    {menuTitle}
                  </p>
                </div>
                <div id={listId} role="listbox" className="custom-select-menu custom-select-menu-mobile" aria-labelledby={`${listId}-title`}>
                  {renderOptions()}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeSelectValue(value?: string | number | readonly string[]) {
  if (Array.isArray(value)) {
    return value[0]?.toString() ?? "";
  }

  return typeof value === "number" ? String(value) : value ?? "";
}

function extractOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }

    const option = child as ReactElement<{ value?: string; children?: ReactNode; disabled?: boolean }>;

    return [
      {
        value: option.props.value?.toString?.() ?? "",
        label: option.props.children,
        disabled: Boolean(option.props.disabled)
      }
    ];
  });
}
