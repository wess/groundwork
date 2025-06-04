export type Property = {
  name: string;
  tsType: string;
  required: boolean;
  column: string;
};

export type SchemaInfo = {
  Name: string;
  lowerCaseName: string;
  tableName: string;
  fields: Property[];
  idField: Property;
  updatableFields: Property[];
  fieldListNoId: string;
  paramPlaceholdersNoId: string;
  paramListNoId: string;
  idTsType: string;
};

export type GenerationPaths = {
  baseSrc: string;
  dbDir: string;
  schemaDir: string;
  providersDir: string;
  routesDir: string;
};

export type GenerationOptions = {
  specPath: string;
  cwd: string;
};
