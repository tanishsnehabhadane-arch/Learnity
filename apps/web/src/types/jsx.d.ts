/**
 * React 19 removed the global JSX namespace; restore it for ergonomic
 * `JSX.Element` annotations across the codebase.
 */
import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type ElementType = ReactJSX.ElementType;
    type ElementClass = ReactJSX.ElementClass;
    type ElementAttributesProperty = ReactJSX.ElementAttributesProperty;
    type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}

export {};
