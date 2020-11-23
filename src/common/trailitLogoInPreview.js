export const addTrailitLogo = () => {
    // Body selector
    const body = document.querySelector('body');

    // Image selector
    const image = document.querySelector('.trailit_logoLeftBottom');

    // <img src={require('/images/trailit_logo.png')} className="trailit_logoLeftBottom" alt=".."/>
    if (body && !image) {
        const element = document.createElement('img');
        element.src = "https://trailit.co/wp-content/uploads/2020/04/logo.png";
        element.className = 'trailit_logoLeftBottom';
        element.alt = 'logo_image_in_preview';

        // Append element in body 
        body.appendChild(element);
    }
};

export const removeTrailitLogo = () => {
    // Image selector
    const image = document.querySelector('.trailit_logoLeftBottom');

    if (image) {
        // Remove image from perent node
        image.parentNode.removeChild(image);
    }
};