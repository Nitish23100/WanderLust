const Joi = require('joi');

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        image: Joi.alternatives().try(
            Joi.object({
                url: Joi.string().allow('', null).optional(),
                filename: Joi.string().optional()
            }),
            Joi.string().allow('', null)
        ).optional(),
        price: Joi.number().min(0).required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        category: Joi.string().valid('trending', 'rooms', 'iconic-cities', 'mountain', 'amazing-pools', 'camping', 'farms', 'arctic').default('trending')
    }).required()
});

module.exports = { listingSchema };

module.exports.reviewSchema = Joi.object({
    review:Joi.object({
        comment:Joi.string().required(),
        rating:Joi.number().required().min(1).max(5)
    }).required()
});