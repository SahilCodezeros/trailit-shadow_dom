
import axios from 'axios';

// Upload media files
export const uploadMediaFile = async (formData) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/uploadTrail_file_media`, formData, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'multipart/form-data',
            'X-Content-Type-Options': 'nosniff',
            'Access-Control-Allow-Methods': 'POST',
            'Accept': 'application/json, text/plain, */*'
        }
    });
};

// Create trails
export const uploadTrails = async (trails) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/createTrailit_trail_data_tour`, trails);
};

// Get all trails
export const getTrails = async (userId) => {
    return await axios.get(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/readTrailit_trails_data_tour/${userId}`)
};

// For follow
export const followTrails = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourFollow/createTrailit_follow_tour`, data);
};

// Get follow data of user
export const getFollowTrails = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourFollow/readTrailits_follow_tour`, data);
};

// Unfollow trail
export const unFollowTrailOfUser = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourFollow/deleteTrailit_follow_tour`, data);
};

// Get all notification
export const getAllNotification = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourNotification/readTrailits_notification_tour`, data);
};

// Remove notification
export const updateNotification = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}userTourNotification/updateTrailit_notification_tour`, data);
};

// Update sorted array
export const arraySorting = async (data) => {
    return await axios.put(`${process.env.REACT_APP_MS4_URL}trailitSorting/sortTrailOrder`, {data});
};

// Get all notification data
export const getAllUser = async () => {
    return await axios.get(`${process.env.REACT_APP_MS2_URL}user/getAllUser`);
};

// Update flag in trail data table
export const updateTrailFlag = async (data) => {
    return await axios.put(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/updateTrail_trail_data_tour`, data);
};

// Create trail_id when user signup
export const createTrailId = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}trailitUser/createTrail_trail_user_tour`, data);
};

// Get trail_id of user
export const getTrailId = async (user_id) => {
    return await axios.get(`${process.env.REACT_APP_MS4_URL}trailitUser/indexTrail_id/${user_id}`);
};

// Get trail_id of user
export const getUserOneTrail = async (user_id, trail_id, screen) => {
    return await axios.get(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/readTrailit_trails_data_tours/${user_id}/${trail_id}/${screen}`);
};

// Get trail_id of user
export const getUserSingleTrail = async (user_id) => {
    return await axios.get(`${process.env.REACT_APP_MS4_URL}trailitUser/fetchusertourdata/${user_id}`);
};

// Get all category
export const getAllCategory = async (user_id) => {
    return await axios.get(`${process.env.REACT_APP_MS4_URL}trailitUser/getAllCategory`);
};

// Update trail data
export const UpdateSingleTrail = async (trail_id, data) => {
    return await axios.put(`${process.env.REACT_APP_MS4_URL}trailitUser/updateTrail_trail_user_tour/${trail_id}`, data);
};

// Update trail data
export const UpdateProfilePicture = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS1_URL}user/uploadUserProfilePic`, data, {withCredentials: true})
};

// Update Trail User Data
export const UpdateTrailData = async (data) => {
    return await axios.post(`${process.env.REACT_APP_MS4_URL}trailitUser/UpdateTrailData`, data);
};

// Delete Trail
export const deleteTrail = async (trailId) => {
    return await axios.delete(`${process.env.REACT_APP_MS4_URL}userTourDataDetail/deleteTrailit_trail_data_tour/${trailId}`);
};