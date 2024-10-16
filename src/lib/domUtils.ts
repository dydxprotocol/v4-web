/**
 * Copied from https://github.com/palantir/blueprint/blob/develop/packages/core/src/common/utils/domUtils.ts#L33
 * Checks whether the given element is inside something that looks like a text input.
 * This is particularly useful to determine if a keyboard event inside this element should take priority over hotkey
 * bindings / keyboard shortcut handlers.
 *
 * @returns true if the element is inside a text input
 */
export function elementIsTextInput(elem: HTMLElement) {
  // we check these cases for unit testing, but this should not happen
  // during normal operation
  if (elem == null || elem.closest == null) {
    return false;
  }

  const editable = elem.closest<HTMLInputElement>('input, textarea, [contenteditable=true]');

  if (editable == null) {
    return false;
  }

  // don't let checkboxes, switches, and radio buttons prevent hotkey behavior
  if (editable.tagName.toLowerCase() === 'input') {
    const inputType = editable.type;
    if (inputType === 'checkbox' || inputType === 'radio') {
      return false;
    }
  }

  // don't let read-only fields prevent hotkey behavior
  if (editable.readOnly) {
    return false;
  }

  return true;
}
