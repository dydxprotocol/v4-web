// eslint-disable-next-line import/no-extraneous-dependencies
import {
  EnumDeclaration,
  InterfaceDeclaration,
  Project,
  SyntaxKind,
  TypeAliasDeclaration,
} from 'ts-morph';

// Initialize a new project
const project = new Project({
  // You can specify your tsconfig path here
  tsConfigFilePath: 'tsconfig.json',
});

// Add source files - replace with your file path
const sourceFile = project.addSourceFileAtPath('./src/types/indexer/indexerApiGen.ts');

// Find all interfaces in the file
const interfaces = sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration);

// Find all enums in the file
const enums = sourceFile.getDescendantsOfKind(SyntaxKind.EnumDeclaration);

// Find all type aliases in the file
const types = sourceFile.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);

// Rename each interface
interfaces.forEach((interfaceDecl: InterfaceDeclaration) => {
  const currentName = interfaceDecl.getName();
  const newName = `Indexer${currentName}`;

  // Rename the interface
  interfaceDecl.rename(newName);
});

// Rename each enum
enums.forEach((enumDecl: EnumDeclaration) => {
  const currentName = enumDecl.getName();
  const newName = `Indexer${currentName}`;

  // Rename the enum
  enumDecl.rename(newName);
});

// Rename each type alias
types.forEach((typeDecl: TypeAliasDeclaration) => {
  const currentName = typeDecl.getName();
  const newName = `Indexer${currentName}`;
  // Rename the type alias
  typeDecl.rename(newName);
});

interfaces.forEach((interfaceDeclaration) => {
  interfaceDeclaration.getProperties().forEach((property) => {
    if (property.hasQuestionToken()) {
      const typeNode = property.getTypeNode();
      if (typeNode && !typeNode.getText().includes('null')) {
        property.setType(`${typeNode.getText()} | null`);
      }
    }
  });
});

// Save the changes
sourceFile.saveSync();
