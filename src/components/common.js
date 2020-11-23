import React from "react";
import { Form, Icon, Input, Button } from "antd";
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-editor-classic/src/classiceditor";
import BlockToolbar from "@ckeditor/ckeditor5-ui/src/toolbar/block/blocktoolbar";
import Autoformat from "@ckeditor/ckeditor5-autoformat/src/autoformat.js";
import Bold from "@ckeditor/ckeditor5-basic-styles/src/bold.js";
import Italic from "@ckeditor/ckeditor5-basic-styles/src/italic.js";
import Underline from "@ckeditor/ckeditor5-basic-styles/src/underline.js";
import Link from "@ckeditor/ckeditor5-link/src/link.js";
import FontColor from "@ckeditor/ckeditor5-font/src/fontcolor.js";
import FontBackgroundColor from "@ckeditor/ckeditor5-font/src/fontbackgroundcolor";
import RemoveFormat from "@ckeditor/ckeditor5-remove-format/src/removeformat.js";
import Essentials from "@ckeditor/ckeditor5-essentials/src/essentials.js";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import SpecialCharacters from "@ckeditor/ckeditor5-special-characters/src/specialcharacters";
import SpecialCharactersEssentials from "@ckeditor/ckeditor5-special-characters/src/specialcharactersessentials";
import { emojis } from "../common/emojis";
import { handleFileUpload } from '../common/audAndVidCommon';

export function collectionHas(a, b) {
    //helper function (see below)
    for (var i = 0, len = a.length; i < len; i++) {
        if (a[i] == b) return true;
    }
    return false;
}

export function findParentBySelector(elm, selector) {
    var all = document.querySelectorAll(selector);
    var cur = elm.parentNode;
    while (cur && !collectionHas(all, cur)) {
        //keep going up until you find a match
        cur = cur.parentNode; //go up
    }
    return cur; //will return null if not found
}

export function queryParentElement(el, selector) {
    el = el;
    let isIDSelector = selector.indexOf("#") === 0;

    if (selector.indexOf(".") === 0 || selector.indexOf("#") === 0) {
        selector = selector.slice(1);
    }

    while (el) {
        if (isIDSelector) {
            if (el.id === selector) {
                return el;
            }
        } else if (el.classList.contains(selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}

export function urlStingCheck(url, array) {
    let status = false;
    array.map((res) => {
        if (url.includes(res) && !url.includes("/#/")) {
            status = true;
        }
    });

    return status;
}

// export function getScrollParent(node) {
//     if (node == null) {
//       return null;
//     }

//     if (node.scrollHeight > node.clientHeight) {
//       return node;
//     } else {
//       return getScrollParent(node.parentNode);
//     }
//   }

export const getScrollParent = (node) => {
    const regex = /(auto|scroll)/;
    const parents = (_node, ps) => {
        if (_node.parentNode === null) {
            return ps;
        }
        return parents(_node.parentNode, ps.concat([_node]));
    };
    
    const style = (_node, prop) =>
        getComputedStyle(_node, null).getPropertyValue(prop);
    const overflow = (_node) =>
        style(_node, "overflow") +
        style(_node, "overflow-y") +
        style(_node, "overflow-x");
    const scroll = (_node) => regex.test(overflow(_node));

    /* eslint-disable consistent-return */
    const scrollParent = (_node) => {
        if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
            return;
        }

        const ps = parents(_node.parentNode, []);

        for (let i = 0; i < ps.length; i += 1) {
            if (scroll(ps[i])) {
                return ps[i];
            }
        }

        return document.scrollingElement || document.documentElement;
    };

    return scrollParent(node);
    /* eslint-enable consistent-return */
};

// Common file upload function
export const commonFileUploadFunction = (file) => {
    return handleFileUpload(file);
};

// Handler file change function
export const handleFileChange = (e, trailStatus, uploadFile) => {
    const file = e.target.files[0];
    const fileType = file.type.split('/');
    e.target.value = null;

    if (trailStatus === 'audio' && fileType[1] === 'mp4') {

        // Upload file function
        uploadFile(file);
    } else if (trailStatus !== fileType[0]) {
        // Return alert
        return alert(`Please upload ${trailStatus} file!`);
    } else if (trailStatus === 'video' && fileType[1] === 'x-matroska') {

        // Return alert
        return alert('MKV format suport coming soon.');
    } else {

        // Upload file function
        uploadFile(file);
    }
};

// On cancel click handler function
// export const onCancelClickHandler = (onCancel, target, count) => {
//     document.designMode = 'off';
//     onCancel(target, count);
// };

// Tooltip form selection function
export const commonTooltipFormFunction = (
    trailStatus, 
    title, 
    fileName, 
    fileLoading, 
    onClickToVisiblePopover, 
    onClickToSubmit, 
    onChangeToInput, 
    handleChange
) => {
    const buttons = (
        <div className="trailButtonsWrapper">
            <Button type="primary" onClick={onClickToVisiblePopover}>
                Cancel
            </Button>

            {/* { 
                (
                    trailStatus === 'audio' || 
                    trailStatus === 'video' || 
                    trailStatus === 'image'
                )
                    && web_url !== '' && fileAddStatus &&
                        <Button type="primary">
                            Preview
                        </Button>
            } */}

            <button
                disabled={fileLoading}
                onClick={onClickToSubmit}
                value="ADD"
                className="ant-btn ant-btn-primary trail_add_step_btn"
            >
                ADD STEP
            </button>
        </div>
    );

    return (
        <div>
            <div className="pl-4 trail_video_frm">
                <input type="text" name="title" value={title} placeholder={`Enter ${trailStatus} Title`} className="ant-input mb-2" onChange={onChangeToInput} autoComplete="off" />
                <input type="text" name="web_url" value={fileName} onChange={onChangeToInput} placeholder={`Add ${trailStatus} URL`} className="ant-input mb-2" />

                <div className="upload_bx">
                    <div className="ant-upload">    
                        <p className="ant-upload-drag-icon">
                            {fileLoading && <div class="trial_spinner"><img class="ring1" src={require(`../images/loding1.png`)} /><img class="ring2" src={require(`../images/loding2.png`)} /></div>}
                            {!fileLoading && <Icon type='cloud-upload' />}

                        </p>
                        <p className="ant-upload-text">Upload {trailStatus}</p>
                    </div>
                    <input style={{ padding: 0 }} type="file" name="media" onChange={handleChange} />
                </div>

                {buttons}
            </div>
        </div>
    );
};

// Common initial render function
export const commonInitialRenderFunction = (
    trailStatus, 
    getFieldDecorator, 
    title,
    description,
    onTitleChangeHandler, 
    onDescriptionChangeHandler, 
    onClickToVisiblePopover, 
    onClickToSubmit, 
    selectedTooltipForm
) => {
    let tooltipForm = null;

    // Adding emojis in special characters
    function SpecialCharactersEmoji(editor) {
        editor.plugins.get("SpecialCharacters").addItems("Emoji", emojis);
    }
    
    const editorConfiguration = {
        plugins: [
            Autoformat,
            Bold,
            Italic,
            Underline,
            SpecialCharacters,
            SpecialCharactersEssentials,
            SpecialCharactersEmoji,
            FontColor,
            FontBackgroundColor,
            RemoveFormat,
            Link,
            Essentials,
            Paragraph,
            BlockToolbar,
        ],
        toolbar: ["bold", "italic", "underline", "link", "specialCharacters"],
        // toolbar: [ 'bold', 'italic', 'underline', 'link', 'specialCharacters', 'fontcolor', 'fontBackgroundColor', 'undo', 'redo' ],
        placeholder: "Please Enter Description",
        link: {
            decorators: {
                addTargetToExternalLinks: {
                    mode: "automatic",
                    callback: (url) => true,
                    attributes: {
                        target: "_blank",
                        rel: "noopener noreferrer",
                    },
                },
            },
        },
    };
    
    // Select form according button clicked
    if (trailStatus === "text") {
        tooltipForm = (
            <Form>
                <Form.Item>
                    {getFieldDecorator("title", {
                        initialValue: title,
                        rules: [
                            {
                                required: true,
                                message: "Please enter title!",
                            },
                        ],
                    })(
                        <Input
                            type="text"
                            onChange={onTitleChangeHandler}
                            placeholder="Enter Title"
                            autoComplete="off"
                        />
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator("description", {
                        rules: [{ required: true, message: "Enter description!" }],
                    })(
                        <CKEditor
                            className="ckeditor"
                            editor={ClassicEditor}
                            config={editorConfiguration}
                            data={ description }
                            onInit={(event, editor) => {
                                document
                                    .querySelector(".ck-content")
                                    .addEventListener("keydown", (e) => {
                                        e.stopPropagation();
                                    });
                            }}
                            onChange={(event, editor) => {
                                let data = editor.getData();
                                
                                if (data.includes('href="') && !data.includes("https://")) {
                                    data = data.replace('href="', 'href="https://');
                                }

                                // Add description into state
                                onDescriptionChangeHandler(data);
                            }}
                        />
                    )}
                </Form.Item>
                <Form.Item className="m-0">
                    <div className="trailButtonsWrapper">
                        <Button type="primary" onClick={onClickToVisiblePopover}>
                            Cancel
                        </Button>

                        {/* { title !== '' && description !== '' &&
                            <Button type="primary">
                                Preview
                            </Button>
                         } */}

                        <Button type="primary" onClick={onClickToSubmit}>
                            Add Step
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        );
    } else if (trailStatus === "audio") {
        tooltipForm = selectedTooltipForm();
    } else if (trailStatus === "video") {
        tooltipForm = selectedTooltipForm();
    } else if (trailStatus === "image") {
        tooltipForm = selectedTooltipForm();
    }
    
    return tooltipForm;
};

// Selecting text, audio, video and image function
export const commonTypeSelectonButton = (
    trailStatus,
    onSelectOption,
    tooltipForm,
    fileName,
    fileLoading
) => {
    
    return (
        <div className="tr_select_type">
            <div className="tr_icon_grp">
                <button
                    className={trailStatus === "text" ? "tr_active" : ""}
                    onClick={() => onSelectOption("text")}
                    // disabled={ (trailStatus !== 'text' && fileName !== '') || fileLoading }
                >
                    <img alt="Text_tooltip" src={require(`../images/text.png`)} />
                </button>
                {!document.URL.includes("https://twitter.com") && (
                    <React.Fragment>
                        <button
                            id="audio_tooltip"
                            className={trailStatus === "audio" ? "tr_active" : ""}
                            onClick={() => onSelectOption("audio")}
                            // disabled={ (trailStatus !== 'audio' && fileName !== '') || fileLoading }
                        >
                            <img alt="audio_tooltip" src={require(`../images/audio.png`)} />
                        </button>
                        <button
                            id="video_tooltip"
                            className={trailStatus === "video" ? "tr_active" : ""}
                            onClick={() => onSelectOption("video")}
                            // disabled={ (trailStatus !== 'video' && fileName !== '') || fileLoading }
                        >
                            <img alt="video_tooltip" src={require(`../images/video.png`)} />
                        </button>
                    </React.Fragment>
                )}
                <button
                    id="picture_tooltip"
                    className={trailStatus === "image" ? "tr_active" : ""}
                    onClick={() => onSelectOption("image")}
                    // disabled={ (trailStatus !== 'image' && fileName !== '') || fileLoading }
                >
                    <img alt="image_tooltip" src={require(`../images/photo.png`)} />
                </button>
            </div>
        
            {tooltipForm}
        </div>
    );
};

export const getUrlVars = () => {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}