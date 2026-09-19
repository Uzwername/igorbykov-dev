export const getById = (id: string): HTMLElement => {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Element with id "${id}" was not found.`);
  }

  return element;
};
