import { uploadMediaFile } from './axios';

const chrome = window.chrome;

export const handleFileUpload = (file) => {
    let formData = new FormData();
    formData.append('media', file);

    return uploadMediaFile(formData);
};

export const saveTrail = (tourType, title, web_url, data, callback) => {
    let trailData = [];
    chrome.storage.local.get(["trail_web_user_tour"], function (items) {        
        if (items.trail_web_user_tour !== undefined) {
            trailData = items.trail_web_user_tour
        }

        if (tourType === 'video' || tourType === 'audio') {
            let obj = {
                url: document.URL,
                path: '',
                selector: '',
                class: '',
                title: title,
                web_url: web_url,
                type: tourType
            }
            trailData.push(obj);
        } else {
            trailData.push(data);
        }    

        callback(trailData);
    });
};