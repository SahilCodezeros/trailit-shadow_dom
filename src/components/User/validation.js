import _ from 'lodash';

export const isValidated = (data) => {
    const errors = {};
    let isValid = false;

    if(_.isEmpty(data.trail_title)) {
        errors.trail_title = "Please enter trail title";
    } else {
        delete errors.trail_title;
    }
    
    return {
        errors,
        isValid: _.isEmpty(errors)
    }
}