import { Injectable } from '@angular/core';
import {
  JSONSchema, JSONSchemaString, JSONSchemaInteger, JSONSchemaNumber, JSONSchemaBoolean,
  JSONSchemaArray, JSONSchemaObject
} from './json-schema';

/**
 * @todo Add other JSON Schema validation features
 */
@Injectable({
  providedIn: 'root'
})
export class JSONValidator {

  /**
   * Validate a JSON data against a JSON Schema
   * @param data JSON data to validate
   * @param schema Subset of JSON Schema.
   * Types are enforced to validate everything:
   * each value MUST have 'type' or 'properties' or 'items' or 'const' or 'enum'.
   * Therefore, unlike the spec, booleans are not allowed as schemas.
   * Not all validation features are supported: just follow the interface.
   * @returns If data is valid : true, if it is invalid : false, and throws if the schema is invalid
   */
  validate(data: any, schema: JSONSchema): boolean {

    switch (schema.type) {

      case 'string':
        return this.validateString(data, schema);
      case 'number':
      case 'integer':
        return this.validateNumber(data, schema);
      case 'boolean':
        return this.validateBoolean(data, schema);
      case 'array':
        return this.validateArray(data, schema);
      case 'object':
        return this.validateObject(data, schema);

    }

  }

  protected validateObject(data: { [k: string]: any; }, schema: JSONSchemaObject): boolean {

    if ((data === null) || (typeof data !== 'object')) {
      return false;
    }

    /**
     * Check if the object doesn't have more properties than expected
     * Equivalent of additionalProperties: false
     */
    if (Object.keys(schema.properties).length < Object.keys(data).length) {
      return false;
    }

    if (!this.validateRequired(data, schema)) {
      return false;
    }

    /* Recursively validate all properties */
    for (const property in schema.properties) {

      if (schema.properties.hasOwnProperty(property) && data.hasOwnProperty(property)) {

        if (!this.validate(data[property], schema.properties[property])) {

          return false;

        }

      }

    }

    return true;

  }

  protected validateRequired(data: {}, schema: JSONSchemaObject): boolean {

    if (!schema.required) {
      return true;
    }

    for (const requiredProp of schema.required) {

      /* Checks if the property is present in the schema 'properties' */
      if (!schema.properties.hasOwnProperty(requiredProp)) {
        throw new Error(`'required' properties must be described in 'properties' too.`);
      }

      /* Checks if the property is present in the data */
      if (!data.hasOwnProperty(requiredProp)) {
        return false;
      }

    }

    return true;

  }

  protected validateConst(data: any, schema: JSONSchemaBoolean | JSONSchemaInteger | JSONSchemaNumber | JSONSchemaString): boolean {

    if (!schema.const) {
      return true;
    }

    return (data === schema.const);

  }

  protected validateEnum(data: any, schema: JSONSchemaInteger | JSONSchemaNumber | JSONSchemaString): boolean {

    if (!schema.enum) {
      return true;
    }

    /** @todo Move to ES2016 .includes() ? */
    return ((schema.enum as any[]).indexOf(data) !== -1);

  }

  protected validateArray(data: any[], schema: JSONSchemaArray): boolean {

    if (!Array.isArray(data)) {
      return false;
    }

    if (schema.hasOwnProperty('maxItems') && (schema.maxItems !== undefined)) {

      if (!Number.isInteger(schema.maxItems) || schema.maxItems < 0) {
        throw new Error(`'maxItems' must be a non-negative integer.`);
      }

      if (data.length > schema.maxItems) {
        return false;
      }

    }

    if (schema.hasOwnProperty('minItems') && (schema.minItems !== undefined)) {

      if (!Number.isInteger(schema.minItems) || schema.minItems < 0) {
        throw new Error(`'minItems' must be a non-negative integer.`);
      }

      if (data.length < schema.minItems) {
        return false;
      }

    }

    if (schema.hasOwnProperty('uniqueItems') && (schema.uniqueItems !== undefined)) {

      if (schema.uniqueItems) {

        const dataSet = new Set(data);

        if (data.length !== dataSet.size) {
          return false;
        }

      }

    }

    for (const value of data) {

      if (!this.validate(value, schema.items)) {
        return false;
      }

    }

    return true;

  }

  protected validateString(data: any, schema: JSONSchemaString): boolean {

    if (typeof data !== 'string') {
      return false;
    }

    if (!this.validateConst(data, schema)) {
      return false;
    }

    if (!this.validateEnum(data, schema)) {
      return false;
    }

    if (schema.hasOwnProperty('maxLength') && (schema.maxLength !== undefined)) {

      if (!Number.isInteger(schema.maxLength) || schema.maxLength < 0) {
        throw new Error(`'maxLength' must be a non-negative integer.`);
      }

      if (data.length > schema.maxLength) {
        return false;
      }

    }

    if (schema.hasOwnProperty('minLength') && (schema.minLength !== undefined)) {

      if (!Number.isInteger(schema.minLength) || schema.minLength < 0) {
        throw new Error(`'minLength' must be a non-negative integer.`);
      }

      if (data.length < schema.minLength) {
        return false;
      }

    }

    if (schema.pattern) {

      const regularExpression = new RegExp(schema.pattern);

      if (!regularExpression.test(data)) {
        return false;
      }

    }

    return true;

  }

  protected validateBoolean(data: any, schema: JSONSchemaBoolean): boolean {

    if (typeof data !== 'boolean') {
      return false;
    }

    if (!this.validateConst(data, schema)) {
      return false;
    }

    return true;

  }

  protected validateNumber(data: any, schema: JSONSchemaNumber | JSONSchemaInteger): boolean {

    if (typeof data !== 'number') {
      return false;
    }

    if ((schema.type === 'integer') && !Number.isInteger(data)) {
      return false;
    }

    if (!this.validateConst(data, schema)) {
      return false;
    }

    if (!this.validateEnum(data, schema)) {
      return false;
    }

    if (schema.hasOwnProperty('multipleOf') && (schema.multipleOf !== undefined)) {

      if (schema.multipleOf <= 0) {
        throw new Error(`'multipleOf' must be a number strictly greater than 0.`);
      }

      if (!Number.isInteger(data / schema.multipleOf)) {
        return false;
      }

    }

    if (schema.hasOwnProperty('maximum') && (schema.maximum !== undefined) && (data > schema.maximum)) {
        return false;
    }

    if (schema.hasOwnProperty('exclusiveMaximum') && (schema.exclusiveMaximum !== undefined) && (data >= schema.exclusiveMaximum)) {
      return false;

    }

    if (schema.hasOwnProperty('minimum') && (schema.minimum !== undefined) && (data < schema.minimum)) {
      return false;

    }

    if (schema.hasOwnProperty('exclusiveMinimum') && (schema.exclusiveMinimum !== undefined) && (data <= schema.exclusiveMinimum)) {
        return false;
    }

    return true;

  }

}
