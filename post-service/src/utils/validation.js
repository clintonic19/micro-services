const express = require('express')
const Joi = require('joi');

//CREATE POST SERVICE VALIDATION SCHEMA
const createPostServiceValidation = (data) =>{
    //USING JOI MODULE TO AUTHENTICATE/VALIDATE USER INPUTS/FIELDS
    const validateSchema = Joi.object({
        content: Joi.string().min(3).max(5000).required(),
        // title: Joi.string().required(),
        imageUrls: Joi.array()
    });
    //Validating the DATA from SCHEMA
    return validateSchema.validate(data)
};



module.exports = { createPostServiceValidation };