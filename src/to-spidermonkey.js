/**
 * Copyright 2014 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Identifier, LiteralStringExpression, LiteralNumericExpression} from "shift-ast";

// convert Shift AST format to SpiderMonkey AST format

export default function convert(ast) {
  if (ast == null) {
    return null;
  }

  if(Convert[ast.type] === convert) throw Error(`convert${ast.type} not implemented.`);

  return Convert[ast.type](ast);
}

function convertFunctionBody(node) {
  return node.directives.map(convert).concat(node.statements.map(convert));
}

function convertFunctionDeclaration(node) {
  return {
    type: "FunctionDeclaration",
    id: convert(node.name),
    params: node.params.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    generator: node.isGenerator,
    expression: false
  };
}

function convertFunctionExpression(node) {
  return {
    type: "FunctionExpression",
    id: convert(node.name),
    params: node.params.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    generator: node.isGenerator,
    expression: false
  };
}

function convertObjectExpression(node) {
  return {
    type: "ObjectExpression",
    properties: node.properties.map(convert)
  };
}

function convertGetter(node) {
  return {
    type: "Property",
    key: convert(node.name),
    computed: false,
    value: convert(node.body),
    method: false,
    shorthand: false,
    kind: "get"
  };
}

function convertSetter(node) {
  return {
    type: "Property",
    key: convert(node.name),
    computed: false,
    value: convert(node.body),
    method: false,
    shorthand: false,
    kind: "set"
  };
}

function convertDataProperty(node) {
  return {
    type: "Property",
    key: convert(node.name),
    value: convert(node.expression),
    kind: "init",
    computed: node.name.type === "ComputedPropertyName",
    method: false,
    shorthand: false
  };
}

function convertComputedPropertyName(node) {
  return convert(node.expression);
}

function convertPropertyName(node) {
  switch (node.type) {
  case "StaticPropertyName":
    return convertStaticPropertyName(node);
  case "ComputedPropertyName":
    return convertComputedPropertyName(node);
  case "ShorthandProperty":
    return convertShorthandProperty(node);
  }
}

function convertLiteralBooleanExpression(node) {
  return {
    type: "Literal",
    value: node.value,
  };
}

function convertLiteralNullExpression() {
  return {
    type: "Literal",
    value: null,
  };
}

function convertLiteralNumericExpression(node) {
  return {
    type: "Literal",
    value: node.value,
  };
}

function convertLiteralInfinityExpression(node) {
  return {
    type: "Literal",
    value: 1 / 0,
  };
}

function convertLiteralRegExpExpression(node) {
  return {
    type: "Literal",
    value: RegExp(node.pattern, node.flags),
    regex: {
      pattern: node.pattern,
      flags: node.flags
    }
  };
}

function convertLiteralStringExpression(node) {
  return {
    type: "Literal",
    value: node.value
  };
}

function convertArrayExpression(node) {
  return {
    type: "ArrayExpression",
    elements: node.elements.map(convert)
  };
}

function convertAssignmentExpression(node) {
  return {
    type: "AssignmentExpression",
    operator: "=",
    left: convert(node.binding),
    right: convert(node.expression)
  };
}

function convertSequenceExpressionToArray(node) {
  let array = [];
  if (node.left.type === "BinaryExpression" && node.left.operator === ",") {
    array = convertSequenceExpressionToArray(node.left);
  } else {
    array = [convert(node.left)];
  }
  array.push(convert(node.right));
  return array;
}

function convertBinaryExpression(node) {
  if (node.operator === ",") {
    return {
      type: "SequenceExpression",
      expressions: convertSequenceExpressionToArray(node)
    };
  }
  return {
    type: node.operator === "||" || node.operator === "&&" ? "LogicalExpression" : "BinaryExpression",
    operator: node.operator,
    left: convert(node.left),
    right: convert(node.right)
  };
}

function convertCallExpression(node) {
  return {
    type: "CallExpression",
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  };
}

function convertComputedMemberExpression(node) {
  return {
    type: "MemberExpression",
    object: convert(node.object),
    property: convert(node.expression),
    computed: true
  };
}

function convertConditionalExpression(node) {
  return {
    type: "ConditionalExpression",
    test: convert(node.test),
    alternate: convert(node.alternate),
    consequent: convert(node.consequent)
  };
}

function convertIdentifierExpression(node) {
  return convert(node.name);
}

function convertNewExpression(node) {
  return {
    type: "NewExpression",
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  };
}

function convertStaticMemberExpression(node) {
  return {
    type: "MemberExpression",
    object: convert(node.object),
    property: convert(node.property),
    computed: false
  };
}

function convertThisExpression() {
  return {
    type: "ThisExpression"
  };
}

function convertBlockStatement(node) {
  return convertBlock(node.block);
}

function convertBreakStatement(node) {
  return {
    type: "BreakStatement",
    label: convert(node.label)
  };
}

function convertContinueStatement(node) {
  return {
    type: "ContinueStatement",
    label: convert(node.label)
  };
}

function convertDebuggerStatement() {
  return {
    type: "DebuggerStatement"
  };
}

function convertDoWhileStatement(node) {
  return {
    type: "DoWhileStatement",
    test: convert(node.test),
    body: convert(node.body)
  };
}

function convertEmptyStatement() {
  return {
    type: "EmptyStatement"
  };
}

function convertExpressionStatement(node) {
  return {
    type: "ExpressionStatement",
    expression: convert(node.expression)
  };
}

function convertForInStatement(node) {
  return {
    type: "ForInStatement",
    left: convert(node.left),
    right: convert(node.right),
    body: convert(node.body),
    each: false
  };
}

function convertForStatement(node) {
  return {
    type: "ForStatement",
    init: convert(node.init),
    test: convert(node.test),
    update: convert(node.update),
    body: convert(node.body)
  };
}

function convertIfStatement(node) {
  return {
    type: "IfStatement",
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  };
}

function convertLabeledStatement(node) {
  return {
    type: "LabeledStatement",
    label: convertIdentifier(node.label),
    body: convert(node.body)
  };
}

function convertReturnStatement(node) {
  return {
    type: "ReturnStatement",
    argument: convert(node.expression)
  };
}

function convertSwitchStatement(node) {
  return {
    type: "SwitchStatement",
    discriminant: convert(node.discriminant),
    cases: node.cases.map(convert)
  };
}

function convertSwitchStatementWithDefault(node) {
  return {
    type: "SwitchStatement",
    discriminant: convert(node.discriminant),
    cases: node.preDefaultCases.map(convert).
        concat(convert(node.defaultCase)).
        concat(node.postDefaultCases.map(convert))
  };
}

function convertThrowStatement(node) {
  return {
    type: "ThrowStatement",
    argument: convert(node.expression)
  };
}

function convertTryCatchStatement(node) {
  let catchClause = convert(node.catchClause);
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [catchClause],
    handler: catchClause,
    guardedHandlers: [],
    finalizer: null
  };
}

function convertTryFinallyStatement(node) {
  let catchClause = convert(node.catchClause);
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [catchClause],
    handler: catchClause,
    guardedHandlers: [],
    finalizer: convert(node.finalizer)
  };
}

function convertVariableDeclarationStatement(node) {
  return convert(node.declaration);
}

function convertWhileStatement(node) {
  return {
    type: "WhileStatement",
    test: convert(node.test),
    body: convert(node.body)
  };
}

function convertWithStatement(node) {
  return {
    type: "WithStatement",
    object: convert(node.object),
    body: convert(node.body)
  };
}

function convertBlock(node) {
  return {
    type: "BlockStatement",
    body: node.statements.map(convert)
  };
}

function convertCatchClause(node) {
  return {
    type: "CatchClause",
    param: convert(node.binding),
    body: convert(node.body)
  };
}

function convertIdentifier(node) {
  return {
    type: "Identifier",
    name: node.name
  };
}

function convertScript(node) {
  return {
    type: "Program",
    body: convertFunctionBody(node.statements),
    sourceType: "script"
  };
}

function convertModule(node) {
  return {
    type: "Program",
    body: convertFunctionBody(node.items),
    sourceType: "module"
  };
}

function convertSwitchCase(node) {
  return {
    type: "SwitchCase",
    test: convert(node.test),
    consequent: node.consequent.map(convert)
  };
}

function convertSwitchDefault(node) {
  return {
    type: "SwitchCase",
    test: null,
    consequent: node.consequent.map(convert)
  };
}

function convertVariableDeclaration(node) {
  return {
    type: "VariableDeclaration",
    declarations: node.declarators.map(convert),
    kind: node.kind
  };
}

function convertVariableDeclarator(node) {
  return {
    type: "VariableDeclarator",
    id: convert(node.binding),
    init: convert(node.init)
  };
}

function convertBindingIdentifier(node) {
  return {
    type: "Identifier",
    name: node.name
  };
}

function convertDirective(node) {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: node.rawValue
    }
  };
}

function convertUpdateExpression(node) {
  return {
    type: "UpdateExpression",
    prefix: node.isPrefix,
    operator: node.operator,
    argument: convert(node.operand)
  };
}

function convertUnaryExpression(node) {
  return {
    type: "UnaryExpression",
    operator: node.operator,
    argument: convert(node.operand),
    prefix: true
  };
}

function convertStaticPropertyName(node) {
  let valueType = typeof node.value;
  if(valueType === "string" || valueType === "number") {
    return {
      type: "Literal",
      value: node.value
    };
  } else {
    return {
      type: "Identifier",
      name: node.value
    };
  }
}

function convertNewTargetExpression(node) {
  return {
    type: "MetaProperty",
    meta: "new",
    property: "target"
  };
}

function convertForOfStatement(node) {
  return {
    type: "ForOfStatement",
    left: convert(node.left),
    right: convert(node.right),
    body: convert(node.body)
  };
}

function convertBindingPropertyIdentifier(node) {
  let key = convert(node.binding);
  let value = !node.init ? key :
      {
        type: "AssignmentPattern",
        left: key,
        right: convert(node.init)
      };
  return {
    type: "Property",
    kind: "init",
    method: false,
    computed: false,
    shorthand: true,
    key,
    value
  };
}

function convertObjectBinding(node) {
  return {
    type: "ObjectPattern",
    properties: node.properties.map(convert)
  };
}

function convertClassDeclaration(node) {
  return {
    type: "ClassDeclaration",
    id: convert(node.name),
    superClass: convert(node.super),
    body: {
      type: "ClassBody",
      body: node.elements.map(convert)
    }
  };
}



function convertClassExpression(node) {
  return Object.assign(convertClassDeclaration(node),{type:"ClassExpression"});
}

function convertArrayBinding(node) {
  let elts = node.elements.map(v => {
    if(v.type === "BindingWithDefault") {
      return {
        type: "AssignmentPattern",
        operator: "=",
        left: convert(v.binding),
        right: convert(v.init)
      };
    }
    return convert(v);
  });
  if(node.restElement) elts.push({
    type: "RestElement",
    argument: convert(node.restElement)
  });
  return { type: "ArrayPattern", elements: elts };
}

function convertBindingPropertyProperty(node) {
  return {
    type: "Property",
    kind: "init",
    computed: false,
    method: false,
    shorthand: false,
    key: convert(node.name),
    value: convert(node.binding)
  };
}

function convertArrowExpression(node)  {
  let [params, defaults] = convertFormalParams(node.params);
  return {
    type: "ArrowFunctionExpression",
    id: null,
    generator: false,
    expression: true,
    params,
    defaults,
    body: convert(node.body)
  };
}

function convertFormalParams(ps) {
  let params = [],
      defaults = [];
  if(ps.items.length > 0) {
    let hasDefaultBindings = false;
    ps.items.forEach(function(v) {
      if(v.type === "BindingWithDefault") {
        hasDefaultBindings = true;
        params.push(convert(v.binding));
        defaults.push(convert(v.init));
      } else {
        params.push(convert(v));
        defaults.push(null);
      }
    });
    if(ps.rest != null) {
      params.push({ type: "RestElement", argument: convert(ps.rest) });
      defaults.push(null);
    }
    if(!hasDefaultBindings) {
      defaults = [];
    }
  }
  return [params, defaults];
}

function convertMethod(node) {
  let [params, defaults] = convertFormalParams(node.params);
  return {
    type: "Property",
    key: convert(node.name),
    computed: node.name.type === "ComputedPropertyName",
    kind: "init",
    method: true,
    shorthand: false,
    value: {
      type: "FunctionExpression",
      id: null,
      params,
      defaults,
      generator: node.isGenerator,
      expression: false,
      body: convert(node.body)
      /*{
        body: convert(node.body),
        type: "BlockStatement"
      }*/
    }
  };
}

function convertClassElement(node) {
  console.log(node)
  let m = node.method,
      [params, defaults] = convertFormalParams(m.params);
  return {
    type: "MethodDefinition",
    key: convert(m.name),
    computed: m.name.type === "ComputedPropertyName",
    kind: m.name.value === "constructor" ? "constructor" : "init",
    static: node.isStatic,
    value: {
      type: "FunctionExpression",
      id: null,
      params,
      defaults,
      generator: m.isGenerator,
      expression: false,
      body: {
        type: "BlockStatement",
        body: convert(m.body)
      }
    }

    //convert(m.body)
  };
  /*let method = convertMethod(node.method);
  method.type = "MethodDefinition";
  delete method.shorthand;
  delete method.method;
  method.static = node.isStatic;
  if(method.key.name === "constructor") method.kind = "constructor";
  return method;*/
}

function convertSuper(node) {
  return {
    type: "Super"
  };
}

function convertTemplateExpression(node) {
  let quasis = [],
      expressions = [];
  node.elements.forEach((v,i) => {
    if(i % 2 === 0) quasis.push(convert(v));
    else expressions.push(convert(v));
  });
  quasis[quasis.length-1].tail = true;
  return {
    type: "TaggedTemplateExpression",
    tag: convert(node.tag),
    quasi: {
      type: "TemplateLiteral",
      quasis,
      expressions
    }
  };
}

function convertTemplateElement(node) {
  return {
    type: "TemplateElement",
    value: {
      raw: node.rawValue,
      cooked: node.rawValue
    },
    tail: false
  };
}

function convertYieldExpression(node) {
  return {
    type: "YieldExpression",
    argument: convert(node.expression),
    delegate: false
  };
}

function convertYieldGeneratorExpression(node) {
  let expr = convertYieldExpression(node);
  expr.delegate = true;
  return expr;
}

function convertExportAllFrom(node) {
  return {
    type: "ExportAllDeclaration",
    source: {
      type: "Literal",
      value: node.moduleSpecifier
    }
  };
}

function convertExportFrom(node) {
  return {
    type: "ExportNamedDeclaration",
    declaration: null,
    source: {
      type: "Literal",
      value: node.moduleSpecifier
    },
    specifiers: node.namedExports.map(convert)
  };
}

function convertExportSpecifier(node) {
  return {
    type: "ExportSpecifier",
    exported: {
      type: "Identifier",
      name: node.exportedName
    },
    local: {
      type: "Identifier",
      name: node.name != null ? node.name : node.exportedName
    }
  };
}

function convertExport(node) {
  return {
    type: "ExportNamedDeclaration",
    declaration: convert(node.declaration),
    specifiers: [],
    source: null
  };
}

function convertExportDefault(node) {
  return {
    type: "ExportDefaultDeclaration",
    declaration: convert(node.body)
  };
}

function convertImport(node) {
  let specifiers = node.namedImports.map(convert);
  if(node.defaultBinding)
    specifiers.unshift({
      type: "ImportDefaultSpecifier",
      local: convert(node.defaultBinding)
    });
  return {
    type: "ImportDeclaration",
    source: {
      type: "Literal",
      value: node.moduleSpecifier
    },
    specifiers
  };
}

function convertImportNamespace(node) {
  return {
    type: "ImportDeclaration",
    source: {
      type: "Literal",
      value: node.moduleSpecifier
    },
    specifiers: [{
      type: "ImportDefaultSpecifier",
      local: convert(node.defaultBinding)
    }, {
      type: "ImportNamespaceSpecifier",
      local: convert(node.namespaceBinding)
    }]
  };
}

function convertImportSpecifier(node) {
  return {
    type: "ImportSpecifier",
    local: convert(node.binding),
    imported: {
      type: "Identifier",
      name: node.name
    }
  };
}

const Convert = {
  // bindings
  BindingWithDefault: convert,
  Parameter: convert, //TODO: add upon parser implementation
  BindingIdentifier: convertBindingIdentifier,
  AssignmentTargetIdentifier: convert,
  ComputedMemberAssignmentTarget: convert,
  StaticMemberAssignmentTarget: convert,
  ArrayBinding: convertArrayBinding,
  ObjectBinding: convertObjectBinding,
  BindingPropertyIdentifier: convertBindingPropertyIdentifier,
  BindingPropertyProperty: convertBindingPropertyProperty,
  AssignmentTargetWithDefault: convert,
  ArrayAssignmentTarget: convert,
  ObjectAssignmentTarget: convert,
  AssignmentTargetPropertyIdentifier: convert,
  AssignmentTargetPropertyProperty: convert,

  // classes
  ClassExpression: convertClassExpression,
  ClassDeclaration: convertClassDeclaration,
  ClassElement: convertClassElement,

  // modules
  Module: convertModule,
  Import: convertImport,
  ImportNamespace: convertImportNamespace,
  ImportSpecifier: convertImportSpecifier,
  ExportAllFrom: convertExportAllFrom,
  ExportFrom: convertExportFrom,
  ExportLocals: convert,
  Export: convertExport,
  ExportDefault: convertExportDefault,
  ExportSpecifier: convertExportSpecifier, //TODO: remove after parser is updated to es2016
  ExportFromSpecifier: convert,
  ExportLocalSpecifier: convert,

  // property definition
  Method: convertMethod,
  Getter: convertGetter,
  Setter: convertSetter,
  DataProperty: convertDataProperty,
  ShorthandProperty: convert,
  ComputedPropertyName: convertComputedPropertyName,
  StaticPropertyName: convertStaticPropertyName,

  // literals
  LiteralBooleanExpression: convertLiteralBooleanExpression,
  LiteralInfinityExpression: convertLiteralInfinityExpression,
  LiteralNullExpression: convertLiteralNullExpression,
  LiteralNumericExpression: convertLiteralNumericExpression,
  LiteralRegExpExpression: convertLiteralRegExpExpression,
  LiteralStringExpression: convertLiteralStringExpression,

  // other expressions
  ArrayExpression: convertArrayExpression,
  ArrowExpression: convertArrowExpression,
  AssignmentExpression: convertAssignmentExpression,
  BinaryExpression: convertBinaryExpression,
  CallExpression: convertCallExpression,
  CompoundAssignmentExpression: convert,
  ComputedMemberExpression: convertComputedMemberExpression,
  ConditionalExpression: convertConditionalExpression,
  FunctionExpression: convertFunctionExpression,
  IdentifierExpression: convertIdentifierExpression,
  NewExpression: convertNewExpression,
  NewTargetExpression: convertNewTargetExpression,
  ObjectExpression: convertObjectExpression,
  UnaryExpression: convertUnaryExpression,
  StaticMemberExpression: convertStaticMemberExpression,
  TemplateExpression: convertTemplateExpression,
  ThisExpression: convertThisExpression,
  UpdateExpression: convertUpdateExpression,
  YieldExpression: convertYieldExpression,
  YieldGeneratorExpression: convertYieldGeneratorExpression,


  // other statements
  BlockStatement: convertBlockStatement,
  BreakStatement: convertBreakStatement,
  ContinueStatement: convertContinueStatement,
  DebuggerStatement: convertDebuggerStatement,
  DoWhileStatement: convertDoWhileStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForInStatement: convertForInStatement,
  ForOfStatement: convertForOfStatement,
  ForStatement: convertForStatement,
  IfStatement: convertIfStatement,
  LabeledStatement: convertLabeledStatement,
  ReturnStatement: convertReturnStatement,
  SwitchStatement: convertSwitchStatement,
  SwitchStatementWithDefault: convertSwitchStatementWithDefault,
  ThrowStatement: convertThrowStatement,
  TryCatchStatement: convertTryCatchStatement,
  TryFinallyStatement: convertTryFinallyStatement,
  VariableDeclarationStatement: convertVariableDeclarationStatement,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,

  // other nodes
  Block: convertBlock,
  CatchClause: convertCatchClause,
  Directive: convertDirective,
  FormalParameters: convert,
  FunctionBody: convertFunctionBody,
  FunctionDeclaration: convertFunctionDeclaration,
  Script: convertScript,
  SpreadElement: convert,
  Super: convertSuper,
  SwitchCase: convertSwitchCase,
  SwitchDefault: convertSwitchDefault,
  TemplateElement: convertTemplateElement,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator
};
