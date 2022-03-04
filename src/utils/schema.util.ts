import toJsonSchema from 'to-json-schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);
const objToBeConverted = {
    $name: 'David',
    rank: 7,
    '#born': '1990-04-05T15:09:56.704Z',
    luckyNumbers: {
        hola: 1,
        chao: 'asd'
    }
};

const objToBeConverted2 = {
    rank: 7,
    '#born': 'asdadasd',
    luckyNumbers: null
};

const schema = toJsonSchema(objToBeConverted, {
    required: false,
    postProcessFnc: (type, schema, value, defaultFunc) => {
        // logger.debug(type);
        // logger.debug(schema);
        // logger.debug(value);

        schema.type = [type, 'null'];

        return defaultFunc(type, schema, value);
    }
});
// logger.debug(schema);
// const validate = ajv.compile(schema);
// const valid = validate(objToBeConverted2);
// logger.debug(validate.errors);
// logger.debug(valid);
