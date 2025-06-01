const express = require('express')
const Joi = require('joi');

//REGISTER USER VALIDATION SCHEMA
const signUpValidation = (data) =>{
    //USING JOI MODULE TO AUTHENTICATE/VALIDATE USER INPUTS/FIELDS
    const validateSchema = Joi.object({
        username: Joi.string().min(3).max(20).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });
    //Validating the DATA from SCHEMA
    return validateSchema.validate(data)
};

//LOGIN USER VALIDATION SCHEMA
const loginUserValidation = (data) =>{
    //USING JOI MODULE TO AUTHENTICATE/VALIDATE USER INPUTS/FIELDS
    const validateSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });
    //Validating the DATA from SCHEMA
    return validateSchema.validate(data)
}

module.exports = {signUpValidation, loginUserValidation};