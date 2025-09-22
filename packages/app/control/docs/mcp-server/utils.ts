import { z } from "zod";

// Helper function to convert Zod schema to JSON schema
export function zodToJsonSchema(schema: z.ZodType<any>): any {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: any = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        if (value instanceof z.ZodNumber) {
          properties[key] = { type: "number" };
          if (value.description) {
            properties[key].description = value.description;
          }
        } else if (value instanceof z.ZodString) {
          properties[key] = { type: "string" };
          if (value.description) {
            properties[key].description = value.description;
          }
        } else if (value instanceof z.ZodOptional) {
          const innerType = value._def.innerType;
          if (innerType instanceof z.ZodNumber) {
            properties[key] = { type: "number" };
            if ((innerType as any).description) {
              properties[key].description = (innerType as any).description;
            }
          } else if (innerType instanceof z.ZodString) {
            properties[key] = { type: "string" };
            if ((innerType as any).description) {
              properties[key].description = (innerType as any).description;
            }
          }
        }
        if (!value.isOptional()) {
          required.push(key);
        }
      }
      
      return {
        type: "object",
        properties,
        required
      };
    }
    return {};
  }
  