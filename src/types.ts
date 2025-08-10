export type FieldType = ' ' | 'date' | 'number' | 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customPassword?: boolean;
  };
  options?: FieldOption[];
  derived?: {
    parents: string[];
    expression: string;
  } | null;
}
export interface FormSchema {
  id: string;
  name: string;
  createdAt: string;
  fields: Field[];
}
