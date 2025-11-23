async function loadImage(imageName, elementSelector) {
  try {
    const result = await window.api.getImagePath(imageName);
    if (result.success) {
      const element = document.querySelector(elementSelector);
      if (element) {
        element.src = result.path;
      }
    } else {
      console.error(`Erreur chargement image ${imageName}:`, result.error);
    }
  } catch (err) {
    console.error(`Erreur lors du chargement de ${imageName}:`, err);
  }
}

async function loadAllDynamicImages() {
  const dynamicImages = document.querySelectorAll('[data-dynamic-image]');
  
  for (const img of dynamicImages) {
    const imageName = img.getAttribute('data-dynamic-image');
    if (imageName) {
      try {
        const result = await window.api.getImagePath(imageName);
        if (result.success) {
          img.src = result.path;
        }
      } catch (err) {
        console.error(`Erreur chargement image ${imageName}:`, err);
      }
    }
  }
}

if (typeof window !== 'undefined' && window.api && window.api.getImagePath) {
  window.addEventListener('DOMContentLoaded', loadAllDynamicImages);
}
