"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convert;
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

// convert Shift AST format to Babylon AST format

function convert(ast) {
  if (ast == null) {
    return null;
  }

  return Convert[ast.type](ast);
}

function convertBindingWithDefault(node) {
  return {
    type: "AssignmentPattern",
    left: convert(node.binding),
    right: convert(node.init)
  };
}

function convertFunctionBody(node) {
  return {
    type: "BlockStatement",
    directives: node.directives ? node.directives.map(convert) : [],
    body: node.statements ? node.statements.map(convert) : []
  };
}

function convertFunctionDeclaration(node) {
  return {
    type: "FunctionDeclaration",
    id: convert(node.name),
    params: convertFormalParameters(node.params),
    body: convert(node.body),
    generator: node.isGenerator,
    expression: false
  };
}

function convertFunctionExpression(node) {
  return {
    type: "FunctionExpression",
    id: convert(node.name),
    params: convertFormalParameters(node.params),
    body: convert(node.body),
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
    type: "ObjectMethod",
    key: convert(node.name),
    computed: false,
    id: null,
    params: [],
    body: convertFunctionBody(node.body),
    generator: false,
    expression: false,
    method: false,
    shorthand: false,
    kind: "get"
  };
}

function convertSetter(node) {
  return {
    type: "ObjectMethod",
    key: convert(node.name),
    computed: node.name.type === "ComputedPropertyName",
    id: null,
    params: [convert(node.param)],
    body: convertFunctionBody(node.body),
    generator: false,
    expression: false,
    method: false,
    shorthand: false,
    kind: "set"
  };
}
function convertMethod(node) {
  if (node.name.value === "constructor") return convertConstructor(node);
  return {
    type: "ObjectMethod",
    key: convert(node.name),
    computed: node.name.type === "ComputedPropertyName",
    kind: "method",
    method: true,
    shorthand: false,
    id: null,
    params: convertFormalParameters(node.params),
    generator: node.isGenerator,
    expression: false,
    body: convertFunctionBody(node.body)
  };
}

function convertDataProperty(node) {
  return {
    type: "ObjectProperty",
    key: convert(node.name),
    value: convert(node.expression),
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
    type: "BooleanLiteral",
    value: node.value
  };
}

function convertLiteralNullExpression() {
  return {
    type: "NullLiteral"
  };
}

function convertLiteralNumericExpression(node) {
  return {
    type: "NumericLiteral",
    value: parseFloat(node.value)
  };
}

function convertLiteralInfinityExpression(node) {
  return {
    type: "NumericLiteral",
    value: 1 / 0
  };
}

function convertLiteralRegExpExpression(node) {
  return {
    type: "RegExpLiteral",
    value: undefined,
    pattern: node.pattern,
    flags: node.flags
  };
}

function convertLiteralStringExpression(node) {
  return {
    type: "StringLiteral",
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
  var array = [];
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

function createIdentifier(name) {
  if (name == null) throw Error("An identifier must have a name!");
  return {
    type: "Identifier",
    name: name
  };
}

function convertIdentifierExpression(node) {
  return createIdentifier(node.name);
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
    property: createIdentifier(node.property),
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
    label: node.label ? createIdentifier(node.label) : null
  };
}

function convertContinueStatement(node) {
  return {
    type: "ContinueStatement",
    label: node.label ? createIdentifier(node.label) : null
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
    body: convert(node.body)
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
    label: createIdentifier(node.label),
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
    cases: node.preDefaultCases.map(convert).concat(convert(node.defaultCase)).concat(node.postDefaultCases.map(convert))
  };
}

function convertThrowStatement(node) {
  return {
    type: "ThrowStatement",
    argument: convert(node.expression)
  };
}

function toTryStatement(convertFinalizer, node) {
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handler: convert(node.catchClause),
    guardedHandlers: [],
    finalizer: convertFinalizer(node.finalizer)
  };
}

var convertTryCatchStatement = toTryStatement.bind(null, function () {
  return null;
});

var convertTryFinallyStatement = toTryStatement.bind(null, convert);

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
    directives: [],
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

function toFile(sourceType, bodyProp, node) {
  return {
    type: "File",
    program: {
      type: "Program",
      directives: node.directives.map(convert),
      body: node[bodyProp].map(convert),
      sourceType: sourceType
    }
  };
}

var convertScript = toFile.bind(null, "script", "statements");

var convertModule = toFile.bind(null, "module", "items");

function toSwitchCase(convertCase, node) {
  return {
    type: "SwitchCase",
    test: convertCase(node.test),
    consequent: node.consequent.map(convert)
  };
}

var convertSwitchCase = toSwitchCase.bind(null, convert);

var convertSwitchDefault = toSwitchCase.bind(null, function () {
  return null;
});

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
  return createIdentifier(node.name);
}

function convertDirective(node) {
  return {
    type: "Directive",
    value: {
      type: "DirectiveLiteral",
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
  var value = parseFloat(node.value) || node.value,
      type = typeof value === "number" ? "NumericLiteral" : "StringLiteral";
  return { type: type, value: value };
}

function convertNewTargetExpression(node) {
  return {
    type: "MetaProperty",
    meta: createIdentifier("new"),
    property: createIdentifier("target")
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
  var key = convert(node.binding);
  var value = !node.init ? key : {
    type: "AssignmentPattern",
    left: key,
    right: convert(node.init)
  };
  return {
    type: "ObjectProperty",
    method: false,
    computed: false,
    shorthand: true,
    key: key,
    value: value
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
  var expression = convertClassDeclaration(node);
  expression.type = "ClassExpression";
  return expression;
}

function convertArrayBinding(node) {
  var elts = node.elements.map(function (v) {
    if (v && v.type === "BindingWithDefault") {
      return convertBindingWithDefault(v);
    }
    return convert(v);
  });
  if (node.restElement) elts.push({
    type: "RestElement",
    argument: convert(node.restElement)
  });
  return { type: "ArrayPattern", elements: elts };
}

function convertBindingPropertyProperty(node) {
  return {
    type: "ObjectProperty",
    computed: false,
    method: false,
    shorthand: false,
    key: convert(node.name),
    value: convert(node.binding)
  };
}

function convertArrowExpression(node) {
  var body = convert(node.body);
  return {
    type: "ArrowFunctionExpression",
    id: null,
    generator: false,
    expression: body.type !== "BlockStatement",
    params: convertFormalParameters(node.params),
    body: convert(node.body)
  };
}

function convertFormalParameters(ps) {
  var params = ps.items.map(convert);
  if (ps.items.length > 0) {
    if (ps.rest != null) {
      params.push({ type: "RestElement", argument: convert(ps.rest) });
    }
  }
  return params;
}

function convertConstructor(m) {
  return {
    type: "ClassMethod",
    key: convert(m.name),
    computed: m.name.type === "ComputedPropertyName",
    kind: m.name.value === "constructor" ? "constructor" : "init",
    static: false,
    id: null,
    params: convertFormalParameters(m.params),
    generator: m.isGenerator,
    expression: false,
    body: convert(m.body)
  };
}

function convertClassElement(node) {
  return convert(node.method);
}

function convertSpreadElement(node) {
  return {
    type: "SpreadElement",
    argument: convert(node.expression)
  };
}

function convertSuper(node) {
  return {
    type: "Super"
  };
}

function convertTemplateExpression(node) {
  var quasis = [],
      expressions = [];
  node.elements.forEach(function (v, i) {
    if (i % 2 === 0) quasis.push(convert(v));else expressions.push(convert(v));
  });
  quasis[quasis.length - 1].tail = true;

  if (node.tag != null) {
    return {
      type: "TaggedTemplateExpression",
      tag: convert(node.tag),
      quasi: {
        type: "TemplateLiteral",
        quasis: quasis,
        expressions: expressions
      }
    };
  }
  return {
    type: "TemplateLiteral",
    quasis: quasis,
    expressions: expressions
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
  var expr = convertYieldExpression(node);
  expr.delegate = true;
  return expr;
}

function convertExportAllFrom(node) {
  return {
    type: "ExportAllDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    }
  };
}

function convertExportFrom(node) {
  return {
    type: "ExportNamedDeclaration",
    declaration: null,
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: node.namedExports.map(convert)
  };
}

function convertExportSpecifier(node) {
  return {
    type: "ExportSpecifier",
    exported: createIdentifier(node.exportedName),
    local: createIdentifier(node.name != null ? node.name : node.exportedName)
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
  var specifiers = node.namedImports.map(convert);
  if (node.defaultBinding) specifiers.unshift({
    type: "ImportDefaultSpecifier",
    local: convert(node.defaultBinding)
  });
  return {
    type: "ImportDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: specifiers
  };
}

function convertImportNamespace(node) {
  var specifiers = [{
    type: "ImportNamespaceSpecifier",
    local: convert(node.namespaceBinding)
  }];
  if (node.defaultBinding != null) {
    specifiers.unshift({
      type: "ImportDefaultSpecifier",
      local: convert(node.defaultBinding)
    });
  }
  return {
    type: "ImportDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: specifiers
  };
}

function convertImportSpecifier(node) {
  return {
    type: "ImportSpecifier",
    local: convert(node.binding),
    imported: createIdentifier(node.name || node.binding.name)
  };
}

function convertShorthandProperty(node) {
  return {
    type: "ObjectProperty",
    shorthand: true,
    method: false,
    computed: false,
    key: createIdentifier(node.name),
    value: createIdentifier(node.name)
  };
}

function convertCompoundAssignmentExpression(node) {
  return {
    type: "AssignmentExpression",
    operator: node.operator,
    left: convert(node.binding),
    right: convert(node.expression)
  };
}

var Convert = {
  // bindings
  BindingWithDefault: convertBindingWithDefault,
  BindingIdentifier: convertBindingIdentifier,
  ArrayBinding: convertArrayBinding,
  ObjectBinding: convertObjectBinding,
  BindingPropertyIdentifier: convertBindingPropertyIdentifier,
  BindingPropertyProperty: convertBindingPropertyProperty,

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
  Export: convertExport,
  ExportDefault: convertExportDefault,
  ExportSpecifier: convertExportSpecifier,

  // property definition
  Method: convertMethod,
  Getter: convertGetter,
  Setter: convertSetter,
  DataProperty: convertDataProperty,
  ShorthandProperty: convertShorthandProperty,
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
  CompoundAssignmentExpression: convertCompoundAssignmentExpression,
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
  FormalParameters: convertFormalParameters,
  FunctionBody: convertFunctionBody,
  FunctionDeclaration: convertFunctionDeclaration,
  Script: convertScript,
  SpreadElement: convertSpreadElement,
  Super: convertSuper,
  SwitchCase: convertSwitchCase,
  SwitchDefault: convertSwitchDefault,
  TemplateElement: convertTemplateElement,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90by1zcGlkZXJtb25rZXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBa0J3QixPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVQsU0FBUyxPQUFULENBQWlCLEdBQWpCLEVBQXNCO0FBQ25DLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2YsV0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBTyxRQUFRLElBQUksSUFBWixFQUFrQixHQUFsQixDQUFQO0FBQ0Q7O0FBRUQsU0FBUyx5QkFBVCxDQUFtQyxJQUFuQyxFQUF5QztBQUN2QyxTQUFPO0FBQ0wsVUFBTSxtQkFERDtBQUVMLFVBQU0sUUFBUSxLQUFLLE9BQWIsQ0FGRDtBQUdMLFdBQU8sUUFBUSxLQUFLLElBQWI7QUFIRixHQUFQO0FBS0Q7O0FBRUQsU0FBUyxtQkFBVCxDQUE2QixJQUE3QixFQUFtQztBQUNqQyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGdCQUFZLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQsRUFGeEQ7QUFHTCxVQUFNLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQ7QUFIbEQsR0FBUDtBQUtEOztBQUVELFNBQVMsMEJBQVQsQ0FBb0MsSUFBcEMsRUFBMEM7QUFDeEMsU0FBTztBQUNMLFVBQU0scUJBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBSEg7QUFJTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBSkQ7QUFLTCxlQUFXLEtBQUssV0FMWDtBQU1MLGdCQUFZO0FBTlAsR0FBUDtBQVFEOztBQUVELFNBQVMseUJBQVQsQ0FBbUMsSUFBbkMsRUFBeUM7QUFDdkMsU0FBTztBQUNMLFVBQU0sb0JBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBSEg7QUFJTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBSkQ7QUFLTCxlQUFXLEtBQUssV0FMWDtBQU1MLGdCQUFZO0FBTlAsR0FBUDtBQVFEOztBQUVELFNBQVMsdUJBQVQsQ0FBaUMsSUFBakMsRUFBdUM7QUFDckMsU0FBTztBQUNMLFVBQU0sa0JBREQ7QUFFTCxnQkFBWSxLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEI7QUFGUCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyxhQUFULENBQXVCLElBQXZCLEVBQTZCO0FBQzNCLFNBQU87QUFDTCxVQUFNLGNBREQ7QUFFTCxTQUFLLFFBQVEsS0FBSyxJQUFiLENBRkE7QUFHTCxjQUFVLEtBSEw7QUFJTCxRQUFJLElBSkM7QUFLTCxZQUFRLEVBTEg7QUFNTCxVQUFNLG9CQUFvQixLQUFLLElBQXpCLENBTkQ7QUFPTCxlQUFXLEtBUE47QUFRTCxnQkFBWSxLQVJQO0FBU0wsWUFBUSxLQVRIO0FBVUwsZUFBVyxLQVZOO0FBV0wsVUFBTTtBQVhELEdBQVA7QUFhRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDM0IsU0FBTztBQUNMLFVBQU0sY0FERDtBQUVMLFNBQUssUUFBUSxLQUFLLElBQWIsQ0FGQTtBQUdMLGNBQVUsS0FBSyxJQUFMLENBQVUsSUFBVixLQUFtQixzQkFIeEI7QUFJTCxRQUFJLElBSkM7QUFLTCxZQUFRLENBQUMsUUFBUSxLQUFLLEtBQWIsQ0FBRCxDQUxIO0FBTUwsVUFBTSxvQkFBb0IsS0FBSyxJQUF6QixDQU5EO0FBT0wsZUFBVyxLQVBOO0FBUUwsZ0JBQVksS0FSUDtBQVNMLFlBQVEsS0FUSDtBQVVMLGVBQVcsS0FWTjtBQVdMLFVBQU07QUFYRCxHQUFQO0FBYUQ7QUFDRCxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDM0IsTUFBRyxLQUFLLElBQUwsQ0FBVSxLQUFWLEtBQW9CLGFBQXZCLEVBQXNDLE9BQU8sbUJBQW1CLElBQW5CLENBQVA7QUFDdEMsU0FBTztBQUNMLFVBQU0sY0FERDtBQUVMLFNBQUssUUFBUSxLQUFLLElBQWIsQ0FGQTtBQUdMLGNBQVUsS0FBSyxJQUFMLENBQVUsSUFBVixLQUFtQixzQkFIeEI7QUFJTCxVQUFNLFFBSkQ7QUFLTCxZQUFRLElBTEg7QUFNTCxlQUFXLEtBTk47QUFPTCxRQUFJLElBUEM7QUFRTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBUkg7QUFTTCxlQUFXLEtBQUssV0FUWDtBQVVMLGdCQUFZLEtBVlA7QUFXTCxVQUFNLG9CQUFvQixLQUFLLElBQXpCO0FBWEQsR0FBUDtBQWFEOztBQUVELFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUM7QUFDakMsU0FBTztBQUNMLFVBQU0sZ0JBREQ7QUFFTCxTQUFLLFFBQVEsS0FBSyxJQUFiLENBRkE7QUFHTCxXQUFPLFFBQVEsS0FBSyxVQUFiLENBSEY7QUFJTCxjQUFVLEtBQUssSUFBTCxDQUFVLElBQVYsS0FBbUIsc0JBSnhCO0FBS0wsWUFBUSxLQUxIO0FBTUwsZUFBVztBQU5OLEdBQVA7QUFRRDs7QUFFRCxTQUFTLDJCQUFULENBQXFDLElBQXJDLEVBQTJDO0FBQ3pDLFNBQU8sUUFBUSxLQUFLLFVBQWIsQ0FBUDtBQUNEOztBQUVELFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUM7QUFDakMsVUFBUSxLQUFLLElBQWI7QUFDRSxTQUFLLG9CQUFMO0FBQ0UsYUFBTywwQkFBMEIsSUFBMUIsQ0FBUDtBQUNGLFNBQUssc0JBQUw7QUFDRSxhQUFPLDRCQUE0QixJQUE1QixDQUFQO0FBQ0YsU0FBSyxtQkFBTDtBQUNFLGFBQU8seUJBQXlCLElBQXpCLENBQVA7QUFOSjtBQVFEOztBQUVELFNBQVMsK0JBQVQsQ0FBeUMsSUFBekMsRUFBK0M7QUFDN0MsU0FBTztBQUNMLFVBQU0sZ0JBREQ7QUFFTCxXQUFPLEtBQUs7QUFGUCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyw0QkFBVCxHQUF3QztBQUN0QyxTQUFPO0FBQ0wsVUFBTTtBQURELEdBQVA7QUFHRDs7QUFFRCxTQUFTLCtCQUFULENBQXlDLElBQXpDLEVBQStDO0FBQzdDLFNBQU87QUFDTCxVQUFNLGdCQUREO0FBRUwsV0FBTyxXQUFXLEtBQUssS0FBaEI7QUFGRixHQUFQO0FBSUQ7O0FBRUQsU0FBUyxnQ0FBVCxDQUEwQyxJQUExQyxFQUFnRDtBQUM5QyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLFdBQU8sSUFBSTtBQUZOLEdBQVA7QUFJRDs7QUFFRCxTQUFTLDhCQUFULENBQXdDLElBQXhDLEVBQThDO0FBQzVDLFNBQU87QUFDTCxVQUFNLGVBREQ7QUFFTCxXQUFPLFNBRkY7QUFHTCxhQUFTLEtBQUssT0FIVDtBQUlMLFdBQU8sS0FBSztBQUpQLEdBQVA7QUFNRDs7QUFFRCxTQUFTLDhCQUFULENBQXdDLElBQXhDLEVBQThDO0FBQzVDLFNBQU87QUFDTCxVQUFNLGVBREQ7QUFFTCxXQUFPLEtBQUs7QUFGUCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQztBQUNwQyxTQUFPO0FBQ0wsVUFBTSxpQkFERDtBQUVMLGNBQVUsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixPQUFsQjtBQUZMLEdBQVA7QUFJRDs7QUFFRCxTQUFTLDJCQUFULENBQXFDLElBQXJDLEVBQTJDO0FBQ3pDLFNBQU87QUFDTCxVQUFNLHNCQUREO0FBRUwsY0FBVSxHQUZMO0FBR0wsVUFBTSxRQUFRLEtBQUssT0FBYixDQUhEO0FBSUwsV0FBTyxRQUFRLEtBQUssVUFBYjtBQUpGLEdBQVA7QUFNRDs7QUFFRCxTQUFTLGdDQUFULENBQTBDLElBQTFDLEVBQWdEO0FBQzlDLE1BQUksUUFBUSxFQUFaO0FBQ0EsTUFBSSxLQUFLLElBQUwsQ0FBVSxJQUFWLEtBQW1CLGtCQUFuQixJQUF5QyxLQUFLLElBQUwsQ0FBVSxRQUFWLEtBQXVCLEdBQXBFLEVBQXlFO0FBQ3ZFLFlBQVEsaUNBQWlDLEtBQUssSUFBdEMsQ0FBUjtBQUNELEdBRkQsTUFFTztBQUNMLFlBQVEsQ0FBQyxRQUFRLEtBQUssSUFBYixDQUFELENBQVI7QUFDRDtBQUNELFFBQU0sSUFBTixDQUFXLFFBQVEsS0FBSyxLQUFiLENBQVg7QUFDQSxTQUFPLEtBQVA7QUFDRDs7QUFFRCxTQUFTLHVCQUFULENBQWlDLElBQWpDLEVBQXVDO0FBQ3JDLE1BQUksS0FBSyxRQUFMLEtBQWtCLEdBQXRCLEVBQTJCO0FBQ3pCLFdBQU87QUFDTCxZQUFNLG9CQUREO0FBRUwsbUJBQWEsaUNBQWlDLElBQWpDO0FBRlIsS0FBUDtBQUlEO0FBQ0QsU0FBTztBQUNMLFVBQU0sS0FBSyxRQUFMLEtBQWtCLElBQWxCLElBQTBCLEtBQUssUUFBTCxLQUFrQixJQUE1QyxHQUFtRCxtQkFBbkQsR0FBeUUsa0JBRDFFO0FBRUwsY0FBVSxLQUFLLFFBRlY7QUFHTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBSEQ7QUFJTCxXQUFPLFFBQVEsS0FBSyxLQUFiO0FBSkYsR0FBUDtBQU1EOztBQUVELFNBQVMscUJBQVQsQ0FBK0IsSUFBL0IsRUFBcUM7QUFDbkMsU0FBTztBQUNMLFVBQU0sZ0JBREQ7QUFFTCxZQUFRLFFBQVEsS0FBSyxNQUFiLENBRkg7QUFHTCxlQUFXLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsT0FBbkI7QUFITixHQUFQO0FBS0Q7O0FBRUQsU0FBUywrQkFBVCxDQUF5QyxJQUF6QyxFQUErQztBQUM3QyxTQUFPO0FBQ0wsVUFBTSxrQkFERDtBQUVMLFlBQVEsUUFBUSxLQUFLLE1BQWIsQ0FGSDtBQUdMLGNBQVUsUUFBUSxLQUFLLFVBQWIsQ0FITDtBQUlMLGNBQVU7QUFKTCxHQUFQO0FBTUQ7O0FBRUQsU0FBUyw0QkFBVCxDQUFzQyxJQUF0QyxFQUE0QztBQUMxQyxTQUFPO0FBQ0wsVUFBTSx1QkFERDtBQUVMLFVBQU0sUUFBUSxLQUFLLElBQWIsQ0FGRDtBQUdMLGVBQVcsUUFBUSxLQUFLLFNBQWIsQ0FITjtBQUlMLGdCQUFZLFFBQVEsS0FBSyxVQUFiO0FBSlAsR0FBUDtBQU1EOztBQUVELFNBQVMsZ0JBQVQsQ0FBMEIsSUFBMUIsRUFBZ0M7QUFDOUIsTUFBRyxRQUFRLElBQVgsRUFBaUIsTUFBTSxNQUFNLGlDQUFOLENBQU47QUFDakIsU0FBTztBQUNMLFVBQU0sWUFERDtBQUVMLFVBQU07QUFGRCxHQUFQO0FBSUQ7O0FBRUQsU0FBUywyQkFBVCxDQUFxQyxJQUFyQyxFQUEyQztBQUN6QyxTQUFPLGlCQUFpQixLQUFLLElBQXRCLENBQVA7QUFDRDs7QUFFRCxTQUFTLG9CQUFULENBQThCLElBQTlCLEVBQW9DO0FBQ2xDLFNBQU87QUFDTCxVQUFNLGVBREQ7QUFFTCxZQUFRLFFBQVEsS0FBSyxNQUFiLENBRkg7QUFHTCxlQUFXLEtBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsT0FBbkI7QUFITixHQUFQO0FBS0Q7O0FBRUQsU0FBUyw2QkFBVCxDQUF1QyxJQUF2QyxFQUE2QztBQUMzQyxTQUFPO0FBQ0wsVUFBTSxrQkFERDtBQUVMLFlBQVEsUUFBUSxLQUFLLE1BQWIsQ0FGSDtBQUdMLGNBQVUsaUJBQWlCLEtBQUssUUFBdEIsQ0FITDtBQUlMLGNBQVU7QUFKTCxHQUFQO0FBTUQ7O0FBRUQsU0FBUyxxQkFBVCxHQUFpQztBQUMvQixTQUFPO0FBQ0wsVUFBTTtBQURELEdBQVA7QUFHRDs7QUFFRCxTQUFTLHFCQUFULENBQStCLElBQS9CLEVBQXFDO0FBQ25DLFNBQU8sYUFBYSxLQUFLLEtBQWxCLENBQVA7QUFDRDs7QUFFRCxTQUFTLHFCQUFULENBQStCLElBQS9CLEVBQXFDO0FBQ25DLFNBQU87QUFDTCxVQUFNLGdCQUREO0FBRUwsV0FBTyxLQUFLLEtBQUwsR0FBYSxpQkFBaUIsS0FBSyxLQUF0QixDQUFiLEdBQTRDO0FBRjlDLEdBQVA7QUFJRDs7QUFFRCxTQUFTLHdCQUFULENBQWtDLElBQWxDLEVBQXdDO0FBQ3RDLFNBQU87QUFDTCxVQUFNLG1CQUREO0FBRUwsV0FBTyxLQUFLLEtBQUwsR0FBYSxpQkFBaUIsS0FBSyxLQUF0QixDQUFiLEdBQTRDO0FBRjlDLEdBQVA7QUFJRDs7QUFFRCxTQUFTLHdCQUFULEdBQW9DO0FBQ2xDLFNBQU87QUFDTCxVQUFNO0FBREQsR0FBUDtBQUdEOztBQUVELFNBQVMsdUJBQVQsQ0FBaUMsSUFBakMsRUFBdUM7QUFDckMsU0FBTztBQUNMLFVBQU0sa0JBREQ7QUFFTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBRkQ7QUFHTCxVQUFNLFFBQVEsS0FBSyxJQUFiO0FBSEQsR0FBUDtBQUtEOztBQUVELFNBQVMscUJBQVQsR0FBaUM7QUFDL0IsU0FBTztBQUNMLFVBQU07QUFERCxHQUFQO0FBR0Q7O0FBRUQsU0FBUywwQkFBVCxDQUFvQyxJQUFwQyxFQUEwQztBQUN4QyxTQUFPO0FBQ0wsVUFBTSxxQkFERDtBQUVMLGdCQUFZLFFBQVEsS0FBSyxVQUFiO0FBRlAsR0FBUDtBQUlEOztBQUVELFNBQVMscUJBQVQsQ0FBK0IsSUFBL0IsRUFBcUM7QUFDbkMsU0FBTztBQUNMLFVBQU0sZ0JBREQ7QUFFTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBRkQ7QUFHTCxXQUFPLFFBQVEsS0FBSyxLQUFiLENBSEY7QUFJTCxVQUFNLFFBQVEsS0FBSyxJQUFiO0FBSkQsR0FBUDtBQU1EOztBQUVELFNBQVMsbUJBQVQsQ0FBNkIsSUFBN0IsRUFBbUM7QUFDakMsU0FBTztBQUNMLFVBQU0sY0FERDtBQUVMLFVBQU0sUUFBUSxLQUFLLElBQWIsQ0FGRDtBQUdMLFVBQU0sUUFBUSxLQUFLLElBQWIsQ0FIRDtBQUlMLFlBQVEsUUFBUSxLQUFLLE1BQWIsQ0FKSDtBQUtMLFVBQU0sUUFBUSxLQUFLLElBQWI7QUFMRCxHQUFQO0FBT0Q7O0FBRUQsU0FBUyxrQkFBVCxDQUE0QixJQUE1QixFQUFrQztBQUNoQyxTQUFPO0FBQ0wsVUFBTSxhQUREO0FBRUwsVUFBTSxRQUFRLEtBQUssSUFBYixDQUZEO0FBR0wsZ0JBQVksUUFBUSxLQUFLLFVBQWIsQ0FIUDtBQUlMLGVBQVcsUUFBUSxLQUFLLFNBQWI7QUFKTixHQUFQO0FBTUQ7O0FBRUQsU0FBUyx1QkFBVCxDQUFpQyxJQUFqQyxFQUF1QztBQUNyQyxTQUFPO0FBQ0wsVUFBTSxrQkFERDtBQUVMLFdBQU8saUJBQWlCLEtBQUssS0FBdEIsQ0FGRjtBQUdMLFVBQU0sUUFBUSxLQUFLLElBQWI7QUFIRCxHQUFQO0FBS0Q7O0FBRUQsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQztBQUNwQyxTQUFPO0FBQ0wsVUFBTSxpQkFERDtBQUVMLGNBQVUsUUFBUSxLQUFLLFVBQWI7QUFGTCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyxzQkFBVCxDQUFnQyxJQUFoQyxFQUFzQztBQUNwQyxTQUFPO0FBQ0wsVUFBTSxpQkFERDtBQUVMLGtCQUFjLFFBQVEsS0FBSyxZQUFiLENBRlQ7QUFHTCxXQUFPLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxPQUFmO0FBSEYsR0FBUDtBQUtEOztBQUVELFNBQVMsaUNBQVQsQ0FBMkMsSUFBM0MsRUFBaUQ7QUFDL0MsU0FBTztBQUNMLFVBQU0saUJBREQ7QUFFTCxrQkFBYyxRQUFRLEtBQUssWUFBYixDQUZUO0FBR0wsV0FBTyxLQUFLLGVBQUwsQ0FBcUIsR0FBckIsQ0FBeUIsT0FBekIsRUFDSCxNQURHLENBQ0ksUUFBUSxLQUFLLFdBQWIsQ0FESixFQUVILE1BRkcsQ0FFSSxLQUFLLGdCQUFMLENBQXNCLEdBQXRCLENBQTBCLE9BQTFCLENBRko7QUFIRixHQUFQO0FBT0Q7O0FBRUQsU0FBUyxxQkFBVCxDQUErQixJQUEvQixFQUFxQztBQUNuQyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGNBQVUsUUFBUSxLQUFLLFVBQWI7QUFGTCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyxjQUFULENBQXdCLGdCQUF4QixFQUEwQyxJQUExQyxFQUFnRDtBQUM5QyxTQUFPO0FBQ0wsVUFBTSxjQUREO0FBRUwsV0FBTyxhQUFhLEtBQUssSUFBbEIsQ0FGRjtBQUdMLGFBQVMsUUFBUSxLQUFLLFdBQWIsQ0FISjtBQUlMLHFCQUFpQixFQUpaO0FBS0wsZUFBVyxpQkFBaUIsS0FBSyxTQUF0QjtBQUxOLEdBQVA7QUFPRDs7QUFFRCxJQUFJLDJCQUEyQixlQUFlLElBQWYsQ0FBb0IsSUFBcEIsRUFBMEI7QUFBQSxTQUFJLElBQUo7QUFBQSxDQUExQixDQUEvQjs7QUFFQSxJQUFJLDZCQUE2QixlQUFlLElBQWYsQ0FBb0IsSUFBcEIsRUFBMEIsT0FBMUIsQ0FBakM7O0FBRUEsU0FBUyxtQ0FBVCxDQUE2QyxJQUE3QyxFQUFtRDtBQUNqRCxTQUFPLFFBQVEsS0FBSyxXQUFiLENBQVA7QUFDRDs7QUFFRCxTQUFTLHFCQUFULENBQStCLElBQS9CLEVBQXFDO0FBQ25DLFNBQU87QUFDTCxVQUFNLGdCQUREO0FBRUwsVUFBTSxRQUFRLEtBQUssSUFBYixDQUZEO0FBR0wsVUFBTSxRQUFRLEtBQUssSUFBYjtBQUhELEdBQVA7QUFLRDs7QUFFRCxTQUFTLG9CQUFULENBQThCLElBQTlCLEVBQW9DO0FBQ2xDLFNBQU87QUFDTCxVQUFNLGVBREQ7QUFFTCxZQUFRLFFBQVEsS0FBSyxNQUFiLENBRkg7QUFHTCxVQUFNLFFBQVEsS0FBSyxJQUFiO0FBSEQsR0FBUDtBQUtEOztBQUVELFNBQVMsWUFBVCxDQUFzQixJQUF0QixFQUE0QjtBQUMxQixTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGdCQUFZLEVBRlA7QUFHTCxVQUFNLEtBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixPQUFwQjtBQUhELEdBQVA7QUFLRDs7QUFFRCxTQUFTLGtCQUFULENBQTRCLElBQTVCLEVBQWtDO0FBQ2hDLFNBQU87QUFDTCxVQUFNLGFBREQ7QUFFTCxXQUFPLFFBQVEsS0FBSyxPQUFiLENBRkY7QUFHTCxVQUFNLFFBQVEsS0FBSyxJQUFiO0FBSEQsR0FBUDtBQUtEOztBQUVELFNBQVMsTUFBVCxDQUFnQixVQUFoQixFQUE0QixRQUE1QixFQUFzQyxJQUF0QyxFQUE0QztBQUMxQyxTQUFPO0FBQ0wsVUFBTSxNQUREO0FBRUwsYUFBUztBQUNQLFlBQU0sU0FEQztBQUVQLGtCQUFZLEtBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixPQUFwQixDQUZMO0FBR1AsWUFBTSxLQUFLLFFBQUwsRUFBZSxHQUFmLENBQW1CLE9BQW5CLENBSEM7QUFJUCxrQkFBWTtBQUpMO0FBRkosR0FBUDtBQVNEOztBQUVELElBQUksZ0JBQWdCLE9BQU8sSUFBUCxDQUFZLElBQVosRUFBa0IsUUFBbEIsRUFBNEIsWUFBNUIsQ0FBcEI7O0FBRUEsSUFBSSxnQkFBZ0IsT0FBTyxJQUFQLENBQVksSUFBWixFQUFrQixRQUFsQixFQUE0QixPQUE1QixDQUFwQjs7QUFFQSxTQUFTLFlBQVQsQ0FBc0IsV0FBdEIsRUFBbUMsSUFBbkMsRUFBeUM7QUFDdkMsU0FBTztBQUNMLFVBQU0sWUFERDtBQUVMLFVBQU0sWUFBWSxLQUFLLElBQWpCLENBRkQ7QUFHTCxnQkFBWSxLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEI7QUFIUCxHQUFQO0FBS0Q7O0FBRUQsSUFBSSxvQkFBb0IsYUFBYSxJQUFiLENBQWtCLElBQWxCLEVBQXdCLE9BQXhCLENBQXhCOztBQUVBLElBQUksdUJBQXVCLGFBQWEsSUFBYixDQUFrQixJQUFsQixFQUF3QjtBQUFBLFNBQUksSUFBSjtBQUFBLENBQXhCLENBQTNCOztBQUVBLFNBQVMsMEJBQVQsQ0FBb0MsSUFBcEMsRUFBMEM7QUFDeEMsU0FBTztBQUNMLFVBQU0scUJBREQ7QUFFTCxrQkFBYyxLQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsT0FBckIsQ0FGVDtBQUdMLFVBQU0sS0FBSztBQUhOLEdBQVA7QUFLRDs7QUFFRCxTQUFTLHlCQUFULENBQW1DLElBQW5DLEVBQXlDO0FBQ3ZDLFNBQU87QUFDTCxVQUFNLG9CQUREO0FBRUwsUUFBSSxRQUFRLEtBQUssT0FBYixDQUZDO0FBR0wsVUFBTSxRQUFRLEtBQUssSUFBYjtBQUhELEdBQVA7QUFLRDs7QUFFRCxTQUFTLHdCQUFULENBQWtDLElBQWxDLEVBQXdDO0FBQ3RDLFNBQU8saUJBQWlCLEtBQUssSUFBdEIsQ0FBUDtBQUNEOztBQUVELFNBQVMsZ0JBQVQsQ0FBMEIsSUFBMUIsRUFBZ0M7QUFDOUIsU0FBTztBQUNMLFVBQU0sV0FERDtBQUVMLFdBQU87QUFDTCxZQUFNLGtCQUREO0FBRUwsYUFBTyxLQUFLO0FBRlA7QUFGRixHQUFQO0FBT0Q7O0FBRUQsU0FBUyx1QkFBVCxDQUFpQyxJQUFqQyxFQUF1QztBQUNyQyxTQUFPO0FBQ0wsVUFBTSxrQkFERDtBQUVMLFlBQVEsS0FBSyxRQUZSO0FBR0wsY0FBVSxLQUFLLFFBSFY7QUFJTCxjQUFVLFFBQVEsS0FBSyxPQUFiO0FBSkwsR0FBUDtBQU1EOztBQUVELFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0M7QUFDcEMsU0FBTztBQUNMLFVBQU0saUJBREQ7QUFFTCxjQUFVLEtBQUssUUFGVjtBQUdMLGNBQVUsUUFBUSxLQUFLLE9BQWIsQ0FITDtBQUlMLFlBQVE7QUFKSCxHQUFQO0FBTUQ7O0FBRUQsU0FBUyx5QkFBVCxDQUFtQyxJQUFuQyxFQUF5QztBQUN2QyxNQUFJLFFBQVEsV0FBVyxLQUFLLEtBQWhCLEtBQTBCLEtBQUssS0FBM0M7TUFDSSxPQUFPLE9BQU8sS0FBUCxLQUFpQixRQUFqQixHQUE0QixnQkFBNUIsR0FBK0MsZUFEMUQ7QUFFQSxTQUFPLEVBQUUsVUFBRixFQUFRLFlBQVIsRUFBUDtBQUNEOztBQUVELFNBQVMsMEJBQVQsQ0FBb0MsSUFBcEMsRUFBMEM7QUFDeEMsU0FBTztBQUNMLFVBQU0sY0FERDtBQUVMLFVBQU0saUJBQWlCLEtBQWpCLENBRkQ7QUFHTCxjQUFVLGlCQUFpQixRQUFqQjtBQUhMLEdBQVA7QUFLRDs7QUFFRCxTQUFTLHFCQUFULENBQStCLElBQS9CLEVBQXFDO0FBQ25DLFNBQU87QUFDTCxVQUFNLGdCQUREO0FBRUwsVUFBTSxRQUFRLEtBQUssSUFBYixDQUZEO0FBR0wsV0FBTyxRQUFRLEtBQUssS0FBYixDQUhGO0FBSUwsVUFBTSxRQUFRLEtBQUssSUFBYjtBQUpELEdBQVA7QUFNRDs7QUFFRCxTQUFTLGdDQUFULENBQTBDLElBQTFDLEVBQWdEO0FBQzlDLE1BQUksTUFBTSxRQUFRLEtBQUssT0FBYixDQUFWO0FBQ0EsTUFBSSxRQUFRLENBQUMsS0FBSyxJQUFOLEdBQWEsR0FBYixHQUNSO0FBQ0UsVUFBTSxtQkFEUjtBQUVFLFVBQU0sR0FGUjtBQUdFLFdBQU8sUUFBUSxLQUFLLElBQWI7QUFIVCxHQURKO0FBTUEsU0FBTztBQUNMLFVBQU0sZ0JBREQ7QUFFTCxZQUFRLEtBRkg7QUFHTCxjQUFVLEtBSEw7QUFJTCxlQUFXLElBSk47QUFLTCxZQUxLO0FBTUw7QUFOSyxHQUFQO0FBUUQ7O0FBRUQsU0FBUyxvQkFBVCxDQUE4QixJQUE5QixFQUFvQztBQUNuQyxTQUFPO0FBQ0osVUFBTSxlQURGO0FBRUosZ0JBQVksS0FBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLE9BQXBCO0FBRlIsR0FBUDtBQUlBOztBQUVELFNBQVMsdUJBQVQsQ0FBaUMsSUFBakMsRUFBdUM7QUFDckMsU0FBTztBQUNMLFVBQU0sa0JBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxnQkFBWSxRQUFRLEtBQUssS0FBYixDQUhQO0FBSUwsVUFBTTtBQUNKLFlBQU0sV0FERjtBQUVKLFlBQU0sS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixPQUFsQjtBQUZGO0FBSkQsR0FBUDtBQVNEOztBQUVELFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0M7QUFDcEMsTUFBSSxhQUFhLHdCQUF3QixJQUF4QixDQUFqQjtBQUNBLGFBQVcsSUFBWCxHQUFrQixpQkFBbEI7QUFDQSxTQUFPLFVBQVA7QUFDRDs7QUFFRCxTQUFTLG1CQUFULENBQTZCLElBQTdCLEVBQW1DO0FBQ2pDLE1BQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGFBQUs7QUFDaEMsUUFBRyxLQUFLLEVBQUUsSUFBRixLQUFXLG9CQUFuQixFQUF5QztBQUN2QyxhQUFPLDBCQUEwQixDQUExQixDQUFQO0FBQ0Q7QUFDRCxXQUFPLFFBQVEsQ0FBUixDQUFQO0FBQ0QsR0FMVSxDQUFYO0FBTUEsTUFBRyxLQUFLLFdBQVIsRUFBcUIsS0FBSyxJQUFMLENBQVU7QUFDN0IsVUFBTSxhQUR1QjtBQUU3QixjQUFVLFFBQVEsS0FBSyxXQUFiO0FBRm1CLEdBQVY7QUFJckIsU0FBTyxFQUFFLE1BQU0sY0FBUixFQUF3QixVQUFVLElBQWxDLEVBQVA7QUFDRDs7QUFFRCxTQUFTLDhCQUFULENBQXdDLElBQXhDLEVBQThDO0FBQzVDLFNBQU87QUFDTCxVQUFNLGdCQUREO0FBRUwsY0FBVSxLQUZMO0FBR0wsWUFBUSxLQUhIO0FBSUwsZUFBVyxLQUpOO0FBS0wsU0FBSyxRQUFRLEtBQUssSUFBYixDQUxBO0FBTUwsV0FBTyxRQUFRLEtBQUssT0FBYjtBQU5GLEdBQVA7QUFRRDs7QUFFRCxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXVDO0FBQ3JDLE1BQUksT0FBTyxRQUFRLEtBQUssSUFBYixDQUFYO0FBQ0EsU0FBTztBQUNMLFVBQU0seUJBREQ7QUFFTCxRQUFJLElBRkM7QUFHTCxlQUFXLEtBSE47QUFJTCxnQkFBWSxLQUFLLElBQUwsS0FBYyxnQkFKckI7QUFLTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBTEg7QUFNTCxVQUFNLFFBQVEsS0FBSyxJQUFiO0FBTkQsR0FBUDtBQVFEOztBQUVELFNBQVMsdUJBQVQsQ0FBaUMsRUFBakMsRUFBcUM7QUFDbkMsTUFBSSxTQUFTLEdBQUcsS0FBSCxDQUFTLEdBQVQsQ0FBYSxPQUFiLENBQWI7QUFDQSxNQUFHLEdBQUcsS0FBSCxDQUFTLE1BQVQsR0FBa0IsQ0FBckIsRUFBd0I7QUFDdEIsUUFBRyxHQUFHLElBQUgsSUFBVyxJQUFkLEVBQW9CO0FBQ2xCLGFBQU8sSUFBUCxDQUFZLEVBQUUsTUFBTSxhQUFSLEVBQXVCLFVBQVUsUUFBUSxHQUFHLElBQVgsQ0FBakMsRUFBWjtBQUNEO0FBQ0Y7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFFRCxTQUFTLGtCQUFULENBQTRCLENBQTVCLEVBQStCO0FBQzdCLFNBQU87QUFDTCxVQUFNLGFBREQ7QUFFTCxTQUFLLFFBQVEsRUFBRSxJQUFWLENBRkE7QUFHTCxjQUFVLEVBQUUsSUFBRixDQUFPLElBQVAsS0FBZ0Isc0JBSHJCO0FBSUwsVUFBTSxFQUFFLElBQUYsQ0FBTyxLQUFQLEtBQWlCLGFBQWpCLEdBQWlDLGFBQWpDLEdBQWlELE1BSmxEO0FBS0wsWUFBUSxLQUxIO0FBTUwsUUFBSSxJQU5DO0FBT0wsWUFBUSx3QkFBd0IsRUFBRSxNQUExQixDQVBIO0FBUUwsZUFBVyxFQUFFLFdBUlI7QUFTTCxnQkFBWSxLQVRQO0FBVUwsVUFBTSxRQUFRLEVBQUUsSUFBVjtBQVZELEdBQVA7QUFZRDs7QUFFRCxTQUFTLG1CQUFULENBQTZCLElBQTdCLEVBQW1DO0FBQ2pDLFNBQU8sUUFBUSxLQUFLLE1BQWIsQ0FBUDtBQUNEOztBQUVELFNBQVMsb0JBQVQsQ0FBOEIsSUFBOUIsRUFBb0M7QUFDbEMsU0FBTztBQUNMLFVBQU0sZUFERDtBQUVMLGNBQVUsUUFBUSxLQUFLLFVBQWI7QUFGTCxHQUFQO0FBSUQ7O0FBRUQsU0FBUyxZQUFULENBQXNCLElBQXRCLEVBQTRCO0FBQzFCLFNBQU87QUFDTCxVQUFNO0FBREQsR0FBUDtBQUdEOztBQUVELFNBQVMseUJBQVQsQ0FBbUMsSUFBbkMsRUFBeUM7QUFDdkMsTUFBSSxTQUFTLEVBQWI7TUFDSSxjQUFjLEVBRGxCO0FBRUEsT0FBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixVQUFDLENBQUQsRUFBRyxDQUFILEVBQVM7QUFDN0IsUUFBRyxJQUFJLENBQUosS0FBVSxDQUFiLEVBQWdCLE9BQU8sSUFBUCxDQUFZLFFBQVEsQ0FBUixDQUFaLEVBQWhCLEtBQ0ssWUFBWSxJQUFaLENBQWlCLFFBQVEsQ0FBUixDQUFqQjtBQUNOLEdBSEQ7QUFJQSxTQUFPLE9BQU8sTUFBUCxHQUFjLENBQXJCLEVBQXdCLElBQXhCLEdBQStCLElBQS9COztBQUVBLE1BQUcsS0FBSyxHQUFMLElBQVksSUFBZixFQUFxQjtBQUNuQixXQUFPO0FBQ0wsWUFBTSwwQkFERDtBQUVMLFdBQUssUUFBUSxLQUFLLEdBQWIsQ0FGQTtBQUdMLGFBQU87QUFDTCxjQUFNLGlCQUREO0FBRUwsc0JBRks7QUFHTDtBQUhLO0FBSEYsS0FBUDtBQVNEO0FBQ0QsU0FBTztBQUNMLFVBQU0saUJBREQ7QUFFTCxrQkFGSztBQUdMO0FBSEssR0FBUDtBQUtEOztBQUVELFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0M7QUFDcEMsU0FBTztBQUNMLFVBQU0saUJBREQ7QUFFTCxXQUFPO0FBQ0wsV0FBSyxLQUFLLFFBREw7QUFFTCxjQUFRLEtBQUs7QUFGUixLQUZGO0FBTUwsVUFBTTtBQU5ELEdBQVA7QUFRRDs7QUFFRCxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDO0FBQ3BDLFNBQU87QUFDTCxVQUFNLGlCQUREO0FBRUwsY0FBVSxRQUFRLEtBQUssVUFBYixDQUZMO0FBR0wsY0FBVTtBQUhMLEdBQVA7QUFLRDs7QUFFRCxTQUFTLCtCQUFULENBQXlDLElBQXpDLEVBQStDO0FBQzdDLE1BQUksT0FBTyx1QkFBdUIsSUFBdkIsQ0FBWDtBQUNBLE9BQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVMsb0JBQVQsQ0FBOEIsSUFBOUIsRUFBb0M7QUFDbEMsU0FBTztBQUNMLFVBQU0sc0JBREQ7QUFFTCxZQUFRO0FBQ04sWUFBTSxlQURBO0FBRU4sYUFBTyxLQUFLO0FBRk47QUFGSCxHQUFQO0FBT0Q7O0FBRUQsU0FBUyxpQkFBVCxDQUEyQixJQUEzQixFQUFpQztBQUMvQixTQUFPO0FBQ0wsVUFBTSx3QkFERDtBQUVMLGlCQUFhLElBRlI7QUFHTCxZQUFRO0FBQ04sWUFBTSxlQURBO0FBRU4sYUFBTyxLQUFLO0FBRk4sS0FISDtBQU9MLGdCQUFZLEtBQUssWUFBTCxDQUFrQixHQUFsQixDQUFzQixPQUF0QjtBQVBQLEdBQVA7QUFTRDs7QUFFRCxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDO0FBQ3BDLFNBQU87QUFDTCxVQUFNLGlCQUREO0FBRUwsY0FBVSxpQkFBaUIsS0FBSyxZQUF0QixDQUZMO0FBR0wsV0FBTyxpQkFBaUIsS0FBSyxJQUFMLElBQWEsSUFBYixHQUFvQixLQUFLLElBQXpCLEdBQWdDLEtBQUssWUFBdEQ7QUFIRixHQUFQO0FBS0Q7O0FBRUQsU0FBUyxhQUFULENBQXVCLElBQXZCLEVBQTZCO0FBQzNCLFNBQU87QUFDTCxVQUFNLHdCQUREO0FBRUwsaUJBQWEsUUFBUSxLQUFLLFdBQWIsQ0FGUjtBQUdMLGdCQUFZLEVBSFA7QUFJTCxZQUFRO0FBSkgsR0FBUDtBQU1EOztBQUVELFNBQVMsb0JBQVQsQ0FBOEIsSUFBOUIsRUFBb0M7QUFDbEMsU0FBTztBQUNMLFVBQU0sMEJBREQ7QUFFTCxpQkFBYSxRQUFRLEtBQUssSUFBYjtBQUZSLEdBQVA7QUFJRDs7QUFFRCxTQUFTLGFBQVQsQ0FBdUIsSUFBdkIsRUFBNkI7QUFDM0IsTUFBSSxhQUFhLEtBQUssWUFBTCxDQUFrQixHQUFsQixDQUFzQixPQUF0QixDQUFqQjtBQUNBLE1BQUcsS0FBSyxjQUFSLEVBQ0UsV0FBVyxPQUFYLENBQW1CO0FBQ2pCLFVBQU0sd0JBRFc7QUFFakIsV0FBTyxRQUFRLEtBQUssY0FBYjtBQUZVLEdBQW5CO0FBSUYsU0FBTztBQUNMLFVBQU0sbUJBREQ7QUFFTCxZQUFRO0FBQ04sWUFBTSxlQURBO0FBRU4sYUFBTyxLQUFLO0FBRk4sS0FGSDtBQU1MO0FBTkssR0FBUDtBQVFEOztBQUVELFNBQVMsc0JBQVQsQ0FBZ0MsSUFBaEMsRUFBc0M7QUFDcEMsTUFBSSxhQUFhLENBQUM7QUFDaEIsVUFBTSwwQkFEVTtBQUVoQixXQUFPLFFBQVEsS0FBSyxnQkFBYjtBQUZTLEdBQUQsQ0FBakI7QUFJQSxNQUFHLEtBQUssY0FBTCxJQUF1QixJQUExQixFQUFnQztBQUM5QixlQUFXLE9BQVgsQ0FBbUI7QUFDakIsWUFBTSx3QkFEVztBQUVqQixhQUFPLFFBQVEsS0FBSyxjQUFiO0FBRlUsS0FBbkI7QUFJRDtBQUNELFNBQU87QUFDTCxVQUFNLG1CQUREO0FBRUwsWUFBUTtBQUNOLFlBQU0sZUFEQTtBQUVOLGFBQU8sS0FBSztBQUZOLEtBRkg7QUFNTDtBQU5LLEdBQVA7QUFRRDs7QUFFRCxTQUFTLHNCQUFULENBQWdDLElBQWhDLEVBQXNDO0FBQ3BDLFNBQU87QUFDTCxVQUFNLGlCQUREO0FBRUwsV0FBTyxRQUFRLEtBQUssT0FBYixDQUZGO0FBR0wsY0FBVSxpQkFBaUIsS0FBSyxJQUFMLElBQWEsS0FBSyxPQUFMLENBQWEsSUFBM0M7QUFITCxHQUFQO0FBS0Q7O0FBRUQsU0FBUyx3QkFBVCxDQUFrQyxJQUFsQyxFQUF3QztBQUN0QyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGVBQVcsSUFGTjtBQUdMLFlBQVEsS0FISDtBQUlMLGNBQVUsS0FKTDtBQUtMLFNBQUssaUJBQWlCLEtBQUssSUFBdEIsQ0FMQTtBQU1MLFdBQU8saUJBQWlCLEtBQUssSUFBdEI7QUFORixHQUFQO0FBUUQ7O0FBRUQsU0FBUyxtQ0FBVCxDQUE2QyxJQUE3QyxFQUFtRDtBQUNqRCxTQUFPO0FBQ0wsVUFBTSxzQkFERDtBQUVMLGNBQVUsS0FBSyxRQUZWO0FBR0wsVUFBTSxRQUFRLEtBQUssT0FBYixDQUhEO0FBSUwsV0FBTyxRQUFRLEtBQUssVUFBYjtBQUpGLEdBQVA7QUFNRDs7QUFFRCxJQUFNLFVBQVU7O0FBRWQsc0JBQW9CLHlCQUZOO0FBR2QscUJBQW1CLHdCQUhMO0FBSWQsZ0JBQWMsbUJBSkE7QUFLZCxpQkFBZSxvQkFMRDtBQU1kLDZCQUEyQixnQ0FOYjtBQU9kLDJCQUF5Qiw4QkFQWDs7O0FBVWQsbUJBQWlCLHNCQVZIO0FBV2Qsb0JBQWtCLHVCQVhKO0FBWWQsZ0JBQWMsbUJBWkE7OztBQWVkLFVBQVEsYUFmTTtBQWdCZCxVQUFRLGFBaEJNO0FBaUJkLG1CQUFpQixzQkFqQkg7QUFrQmQsbUJBQWlCLHNCQWxCSDtBQW1CZCxpQkFBZSxvQkFuQkQ7QUFvQmQsY0FBWSxpQkFwQkU7QUFxQmQsVUFBUSxhQXJCTTtBQXNCZCxpQkFBZSxvQkF0QkQ7QUF1QmQsbUJBQWlCLHNCQXZCSDs7O0FBMEJkLFVBQVEsYUExQk07QUEyQmQsVUFBUSxhQTNCTTtBQTRCZCxVQUFRLGFBNUJNO0FBNkJkLGdCQUFjLG1CQTdCQTtBQThCZCxxQkFBbUIsd0JBOUJMO0FBK0JkLHdCQUFzQiwyQkEvQlI7QUFnQ2Qsc0JBQW9CLHlCQWhDTjs7O0FBbUNkLDRCQUEwQiwrQkFuQ1o7QUFvQ2QsNkJBQTJCLGdDQXBDYjtBQXFDZCx5QkFBdUIsNEJBckNUO0FBc0NkLDRCQUEwQiwrQkF0Q1o7QUF1Q2QsMkJBQXlCLDhCQXZDWDtBQXdDZCwyQkFBeUIsOEJBeENYOzs7QUEyQ2QsbUJBQWlCLHNCQTNDSDtBQTRDZCxtQkFBaUIsc0JBNUNIO0FBNkNkLHdCQUFzQiwyQkE3Q1I7QUE4Q2Qsb0JBQWtCLHVCQTlDSjtBQStDZCxrQkFBZ0IscUJBL0NGO0FBZ0RkLGdDQUE4QixtQ0FoRGhCO0FBaURkLDRCQUEwQiwrQkFqRFo7QUFrRGQseUJBQXVCLDRCQWxEVDtBQW1EZCxzQkFBb0IseUJBbkROO0FBb0RkLHdCQUFzQiwyQkFwRFI7QUFxRGQsaUJBQWUsb0JBckREO0FBc0RkLHVCQUFxQiwwQkF0RFA7QUF1RGQsb0JBQWtCLHVCQXZESjtBQXdEZCxtQkFBaUIsc0JBeERIO0FBeURkLDBCQUF3Qiw2QkF6RFY7QUEwRGQsc0JBQW9CLHlCQTFETjtBQTJEZCxrQkFBZ0IscUJBM0RGO0FBNERkLG9CQUFrQix1QkE1REo7QUE2RGQsbUJBQWlCLHNCQTdESDtBQThEZCw0QkFBMEIsK0JBOURaOzs7QUFrRWQsa0JBQWdCLHFCQWxFRjtBQW1FZCxrQkFBZ0IscUJBbkVGO0FBb0VkLHFCQUFtQix3QkFwRUw7QUFxRWQscUJBQW1CLHdCQXJFTDtBQXNFZCxvQkFBa0IsdUJBdEVKO0FBdUVkLGtCQUFnQixxQkF2RUY7QUF3RWQsdUJBQXFCLDBCQXhFUDtBQXlFZCxrQkFBZ0IscUJBekVGO0FBMEVkLGtCQUFnQixxQkExRUY7QUEyRWQsZ0JBQWMsbUJBM0VBO0FBNEVkLGVBQWEsa0JBNUVDO0FBNkVkLG9CQUFrQix1QkE3RUo7QUE4RWQsbUJBQWlCLHNCQTlFSDtBQStFZCxtQkFBaUIsc0JBL0VIO0FBZ0ZkLDhCQUE0QixpQ0FoRmQ7QUFpRmQsa0JBQWdCLHFCQWpGRjtBQWtGZCxxQkFBbUIsd0JBbEZMO0FBbUZkLHVCQUFxQiwwQkFuRlA7QUFvRmQsZ0NBQThCLG1DQXBGaEI7QUFxRmQsa0JBQWdCLHFCQXJGRjtBQXNGZCxpQkFBZSxvQkF0RkQ7OztBQXlGZCxTQUFPLFlBekZPO0FBMEZkLGVBQWEsa0JBMUZDO0FBMkZkLGFBQVcsZ0JBM0ZHO0FBNEZkLG9CQUFrQix1QkE1Rko7QUE2RmQsZ0JBQWMsbUJBN0ZBO0FBOEZkLHVCQUFxQiwwQkE5RlA7QUErRmQsVUFBUSxhQS9GTTtBQWdHZCxpQkFBZSxvQkFoR0Q7QUFpR2QsU0FBTyxZQWpHTztBQWtHZCxjQUFZLGlCQWxHRTtBQW1HZCxpQkFBZSxvQkFuR0Q7QUFvR2QsbUJBQWlCLHNCQXBHSDtBQXFHZCx1QkFBcUIsMEJBckdQO0FBc0dkLHNCQUFvQjtBQXRHTixDQUFoQiIsImZpbGUiOiJ0by1zcGlkZXJtb25rZXkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gY29udmVydCBTaGlmdCBBU1QgZm9ybWF0IHRvIEJhYnlsb24gQVNUIGZvcm1hdFxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0KGFzdCkge1xuICBpZiAoYXN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBDb252ZXJ0W2FzdC50eXBlXShhc3QpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluZGluZ1dpdGhEZWZhdWx0KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIsXG4gICAgbGVmdDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuaW5pdClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uQm9keShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgIGRpcmVjdGl2ZXM6IG5vZGUuZGlyZWN0aXZlcyA/IG5vZGUuZGlyZWN0aXZlcy5tYXAoY29udmVydCkgOiBbXSxcbiAgICBib2R5OiBub2RlLnN0YXRlbWVudHMgPyBub2RlLnN0YXRlbWVudHMubWFwKGNvbnZlcnQpIDogW11cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogbm9kZS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogbm9kZS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RFeHByZXNzaW9uXCIsXG4gICAgcHJvcGVydGllczogbm9kZS5wcm9wZXJ0aWVzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0R2V0dGVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdE1ldGhvZFwiLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICBpZDogbnVsbCxcbiAgICBwYXJhbXM6IFtdLFxuICAgIGJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZS5ib2R5KSxcbiAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBraW5kOiBcImdldFwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTZXR0ZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0TWV0aG9kXCIsXG4gICAga2V5OiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgY29tcHV0ZWQ6IG5vZGUubmFtZS50eXBlID09PSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBbY29udmVydChub2RlLnBhcmFtKV0sXG4gICAgYm9keTogY29udmVydEZ1bmN0aW9uQm9keShub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgZXhwcmVzc2lvbjogZmFsc2UsXG4gICAgbWV0aG9kOiBmYWxzZSxcbiAgICBzaG9ydGhhbmQ6IGZhbHNlLFxuICAgIGtpbmQ6IFwic2V0XCJcbiAgfTtcbn1cbmZ1bmN0aW9uIGNvbnZlcnRNZXRob2Qobm9kZSkge1xuICBpZihub2RlLm5hbWUudmFsdWUgPT09IFwiY29uc3RydWN0b3JcIikgcmV0dXJuIGNvbnZlcnRDb25zdHJ1Y3Rvcihub2RlKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdE1ldGhvZFwiLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBub2RlLm5hbWUudHlwZSA9PT0gXCJDb21wdXRlZFByb3BlcnR5TmFtZVwiLFxuICAgIGtpbmQ6IFwibWV0aG9kXCIsXG4gICAgbWV0aG9kOiB0cnVlLFxuICAgIHNob3J0aGFuZDogZmFsc2UsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgZ2VuZXJhdG9yOiBub2RlLmlzR2VuZXJhdG9yLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIGJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RGF0YVByb3BlcnR5KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAga2V5OiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgdmFsdWU6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKSxcbiAgICBjb21wdXRlZDogbm9kZS5uYW1lLnR5cGUgPT09IFwiQ29tcHV0ZWRQcm9wZXJ0eU5hbWVcIixcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIHNob3J0aGFuZDogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgcmV0dXJuIGNvbnZlcnQobm9kZS5leHByZXNzaW9uKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFByb3BlcnR5TmFtZShub2RlKSB7XG4gIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgY2FzZSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiOlxuICAgICAgcmV0dXJuIGNvbnZlcnRTdGF0aWNQcm9wZXJ0eU5hbWUobm9kZSk7XG4gICAgY2FzZSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCI6XG4gICAgICByZXR1cm4gY29udmVydENvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUpO1xuICAgIGNhc2UgXCJTaG9ydGhhbmRQcm9wZXJ0eVwiOlxuICAgICAgcmV0dXJuIGNvbnZlcnRTaG9ydGhhbmRQcm9wZXJ0eShub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkJvb2xlYW5MaXRlcmFsXCIsXG4gICAgdmFsdWU6IG5vZGUudmFsdWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxOdWxsRXhwcmVzc2lvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk51bGxMaXRlcmFsXCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJOdW1lcmljTGl0ZXJhbFwiLFxuICAgIHZhbHVlOiBwYXJzZUZsb2F0KG5vZGUudmFsdWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk51bWVyaWNMaXRlcmFsXCIsXG4gICAgdmFsdWU6IDEgLyAwXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJSZWdFeHBMaXRlcmFsXCIsXG4gICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICBwYXR0ZXJuOiBub2RlLnBhdHRlcm4sXG4gICAgZmxhZ3M6IG5vZGUuZmxhZ3NcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICB2YWx1ZTogbm9kZS52YWx1ZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXJyYXlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFycmF5RXhwcmVzc2lvblwiLFxuICAgIGVsZW1lbnRzOiBub2RlLmVsZW1lbnRzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIixcbiAgICBvcGVyYXRvcjogXCI9XCIsXG4gICAgbGVmdDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFNlcXVlbmNlRXhwcmVzc2lvblRvQXJyYXkobm9kZSkge1xuICBsZXQgYXJyYXkgPSBbXTtcbiAgaWYgKG5vZGUubGVmdC50eXBlID09PSBcIkJpbmFyeUV4cHJlc3Npb25cIiAmJiBub2RlLmxlZnQub3BlcmF0b3IgPT09IFwiLFwiKSB7XG4gICAgYXJyYXkgPSBjb252ZXJ0U2VxdWVuY2VFeHByZXNzaW9uVG9BcnJheShub2RlLmxlZnQpO1xuICB9IGVsc2Uge1xuICAgIGFycmF5ID0gW2NvbnZlcnQobm9kZS5sZWZ0KV07XG4gIH1cbiAgYXJyYXkucHVzaChjb252ZXJ0KG5vZGUucmlnaHQpKTtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluYXJ5RXhwcmVzc2lvbihub2RlKSB7XG4gIGlmIChub2RlLm9wZXJhdG9yID09PSBcIixcIikge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIlNlcXVlbmNlRXhwcmVzc2lvblwiLFxuICAgICAgZXhwcmVzc2lvbnM6IGNvbnZlcnRTZXF1ZW5jZUV4cHJlc3Npb25Ub0FycmF5KG5vZGUpXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGU6IG5vZGUub3BlcmF0b3IgPT09IFwifHxcIiB8fCBub2RlLm9wZXJhdG9yID09PSBcIiYmXCIgPyBcIkxvZ2ljYWxFeHByZXNzaW9uXCIgOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUubGVmdCksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5yaWdodClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENhbGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNhbGxFeHByZXNzaW9uXCIsXG4gICAgY2FsbGVlOiBjb252ZXJ0KG5vZGUuY2FsbGVlKSxcbiAgICBhcmd1bWVudHM6IG5vZGUuYXJndW1lbnRzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIixcbiAgICBvYmplY3Q6IGNvbnZlcnQobm9kZS5vYmplY3QpLFxuICAgIHByb3BlcnR5OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbiksXG4gICAgY29tcHV0ZWQ6IHRydWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIixcbiAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgYWx0ZXJuYXRlOiBjb252ZXJ0KG5vZGUuYWx0ZXJuYXRlKSxcbiAgICBjb25zZXF1ZW50OiBjb252ZXJ0KG5vZGUuY29uc2VxdWVudClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSWRlbnRpZmllcihuYW1lKSB7XG4gIGlmKG5hbWUgPT0gbnVsbCkgdGhyb3cgRXJyb3IoXCJBbiBpZGVudGlmaWVyIG11c3QgaGF2ZSBhIG5hbWUhXCIpO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSWRlbnRpZmllclwiLFxuICAgIG5hbWU6IG5hbWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydElkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIGNyZWF0ZUlkZW50aWZpZXIobm9kZS5uYW1lKTtcbn1cblxuZnVuY3Rpb24gY29udmVydE5ld0V4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTmV3RXhwcmVzc2lvblwiLFxuICAgIGNhbGxlZTogY29udmVydChub2RlLmNhbGxlZSksXG4gICAgYXJndW1lbnRzOiBub2RlLmFyZ3VtZW50cy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN0YXRpY01lbWJlckV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgIG9iamVjdDogY29udmVydChub2RlLm9iamVjdCksXG4gICAgcHJvcGVydHk6IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5wcm9wZXJ0eSksXG4gICAgY29tcHV0ZWQ6IGZhbHNlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaGlzRXhwcmVzc2lvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRoaXNFeHByZXNzaW9uXCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJsb2NrU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIGNvbnZlcnRCbG9jayhub2RlLmJsb2NrKTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJyZWFrU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkJyZWFrU3RhdGVtZW50XCIsXG4gICAgbGFiZWw6IG5vZGUubGFiZWwgPyBjcmVhdGVJZGVudGlmaWVyKG5vZGUubGFiZWwpIDogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q29udGludWVTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQ29udGludWVTdGF0ZW1lbnRcIixcbiAgICBsYWJlbDogbm9kZS5sYWJlbCA/IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5sYWJlbCkgOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREZWJ1Z2dlclN0YXRlbWVudCgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkRlYnVnZ2VyU3RhdGVtZW50XCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydERvV2hpbGVTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRG9XaGlsZVN0YXRlbWVudFwiLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEVtcHR5U3RhdGVtZW50KCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRW1wdHlTdGF0ZW1lbnRcIlxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwcmVzc2lvblN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsXG4gICAgZXhwcmVzc2lvbjogY29udmVydChub2RlLmV4cHJlc3Npb24pXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JJblN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJGb3JJblN0YXRlbWVudFwiLFxuICAgIGxlZnQ6IGNvbnZlcnQobm9kZS5sZWZ0KSxcbiAgICByaWdodDogY29udmVydChub2RlLnJpZ2h0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRm9yU3RhdGVtZW50XCIsXG4gICAgaW5pdDogY29udmVydChub2RlLmluaXQpLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICB1cGRhdGU6IGNvbnZlcnQobm9kZS51cGRhdGUpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SWZTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSWZTdGF0ZW1lbnRcIixcbiAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgY29uc2VxdWVudDogY29udmVydChub2RlLmNvbnNlcXVlbnQpLFxuICAgIGFsdGVybmF0ZTogY29udmVydChub2RlLmFsdGVybmF0ZSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExhYmVsZWRTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTGFiZWxlZFN0YXRlbWVudFwiLFxuICAgIGxhYmVsOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubGFiZWwpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UmV0dXJuU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlJldHVyblN0YXRlbWVudFwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN3aXRjaFN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJTd2l0Y2hTdGF0ZW1lbnRcIixcbiAgICBkaXNjcmltaW5hbnQ6IGNvbnZlcnQobm9kZS5kaXNjcmltaW5hbnQpLFxuICAgIGNhc2VzOiBub2RlLmNhc2VzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50XCIsXG4gICAgZGlzY3JpbWluYW50OiBjb252ZXJ0KG5vZGUuZGlzY3JpbWluYW50KSxcbiAgICBjYXNlczogbm9kZS5wcmVEZWZhdWx0Q2FzZXMubWFwKGNvbnZlcnQpLlxuICAgICAgICBjb25jYXQoY29udmVydChub2RlLmRlZmF1bHRDYXNlKSkuXG4gICAgICAgIGNvbmNhdChub2RlLnBvc3REZWZhdWx0Q2FzZXMubWFwKGNvbnZlcnQpKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGhyb3dTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVGhyb3dTdGF0ZW1lbnRcIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLmV4cHJlc3Npb24pXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvVHJ5U3RhdGVtZW50KGNvbnZlcnRGaW5hbGl6ZXIsIG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRyeVN0YXRlbWVudFwiLFxuICAgIGJsb2NrOiBjb252ZXJ0QmxvY2sobm9kZS5ib2R5KSxcbiAgICBoYW5kbGVyOiBjb252ZXJ0KG5vZGUuY2F0Y2hDbGF1c2UpLFxuICAgIGd1YXJkZWRIYW5kbGVyczogW10sXG4gICAgZmluYWxpemVyOiBjb252ZXJ0RmluYWxpemVyKG5vZGUuZmluYWxpemVyKVxuICB9O1xufVxuXG5sZXQgY29udmVydFRyeUNhdGNoU3RhdGVtZW50ID0gdG9UcnlTdGF0ZW1lbnQuYmluZChudWxsLCAoKT0+bnVsbCk7XG5cbmxldCBjb252ZXJ0VHJ5RmluYWxseVN0YXRlbWVudCA9IHRvVHJ5U3RhdGVtZW50LmJpbmQobnVsbCwgY29udmVydCk7XG5cbmZ1bmN0aW9uIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIGNvbnZlcnQobm9kZS5kZWNsYXJhdGlvbik7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRXaGlsZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJXaGlsZVN0YXRlbWVudFwiLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFdpdGhTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiV2l0aFN0YXRlbWVudFwiLFxuICAgIG9iamVjdDogY29udmVydChub2RlLm9iamVjdCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCbG9jayhub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgIGRpcmVjdGl2ZXM6IFtdLFxuICAgIGJvZHk6IG5vZGUuc3RhdGVtZW50cy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENhdGNoQ2xhdXNlKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNhdGNoQ2xhdXNlXCIsXG4gICAgcGFyYW06IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gdG9GaWxlKHNvdXJjZVR5cGUsIGJvZHlQcm9wLCBub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJGaWxlXCIsXG4gICAgcHJvZ3JhbToge1xuICAgICAgdHlwZTogXCJQcm9ncmFtXCIsXG4gICAgICBkaXJlY3RpdmVzOiBub2RlLmRpcmVjdGl2ZXMubWFwKGNvbnZlcnQpLFxuICAgICAgYm9keTogbm9kZVtib2R5UHJvcF0ubWFwKGNvbnZlcnQpLFxuICAgICAgc291cmNlVHlwZTogc291cmNlVHlwZVxuICAgIH1cbiAgfTtcbn1cblxubGV0IGNvbnZlcnRTY3JpcHQgPSB0b0ZpbGUuYmluZChudWxsLCBcInNjcmlwdFwiLCBcInN0YXRlbWVudHNcIik7XG5cbmxldCBjb252ZXJ0TW9kdWxlID0gdG9GaWxlLmJpbmQobnVsbCwgXCJtb2R1bGVcIiwgXCJpdGVtc1wiKTtcblxuZnVuY3Rpb24gdG9Td2l0Y2hDYXNlKGNvbnZlcnRDYXNlLCBub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJTd2l0Y2hDYXNlXCIsXG4gICAgdGVzdDogY29udmVydENhc2Uobm9kZS50ZXN0KSxcbiAgICBjb25zZXF1ZW50OiBub2RlLmNvbnNlcXVlbnQubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmxldCBjb252ZXJ0U3dpdGNoQ2FzZSA9IHRvU3dpdGNoQ2FzZS5iaW5kKG51bGwsIGNvbnZlcnQpO1xuXG5sZXQgY29udmVydFN3aXRjaERlZmF1bHQgPSB0b1N3aXRjaENhc2UuYmluZChudWxsLCAoKT0+bnVsbCk7XG5cbmZ1bmN0aW9uIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIixcbiAgICBkZWNsYXJhdGlvbnM6IG5vZGUuZGVjbGFyYXRvcnMubWFwKGNvbnZlcnQpLFxuICAgIGtpbmQ6IG5vZGUua2luZFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdG9yKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlZhcmlhYmxlRGVjbGFyYXRvclwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUuYmluZGluZyksXG4gICAgaW5pdDogY29udmVydChub2RlLmluaXQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaW5kaW5nSWRlbnRpZmllcihub2RlKSB7XG4gIHJldHVybiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREaXJlY3RpdmUobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRGlyZWN0aXZlXCIsXG4gICAgdmFsdWU6IHtcbiAgICAgIHR5cGU6IFwiRGlyZWN0aXZlTGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IG5vZGUucmF3VmFsdWVcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRVcGRhdGVFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlVwZGF0ZUV4cHJlc3Npb25cIixcbiAgICBwcmVmaXg6IG5vZGUuaXNQcmVmaXgsXG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgYXJndW1lbnQ6IGNvbnZlcnQobm9kZS5vcGVyYW5kKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VW5hcnlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlVuYXJ5RXhwcmVzc2lvblwiLFxuICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUub3BlcmFuZCksXG4gICAgcHJlZml4OiB0cnVlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTdGF0aWNQcm9wZXJ0eU5hbWUobm9kZSkge1xuICBsZXQgdmFsdWUgPSBwYXJzZUZsb2F0KG5vZGUudmFsdWUpIHx8IG5vZGUudmFsdWUsXG4gICAgICB0eXBlID0gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiID8gXCJOdW1lcmljTGl0ZXJhbFwiIDogXCJTdHJpbmdMaXRlcmFsXCI7XG4gIHJldHVybiB7IHR5cGUsIHZhbHVlIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROZXdUYXJnZXRFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk1ldGFQcm9wZXJ0eVwiLFxuICAgIG1ldGE6IGNyZWF0ZUlkZW50aWZpZXIoXCJuZXdcIiksXG4gICAgcHJvcGVydHk6IGNyZWF0ZUlkZW50aWZpZXIoXCJ0YXJnZXRcIilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvck9mU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZvck9mU3RhdGVtZW50XCIsXG4gICAgbGVmdDogY29udmVydChub2RlLmxlZnQpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUucmlnaHQpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlKSB7XG4gIGxldCBrZXkgPSBjb252ZXJ0KG5vZGUuYmluZGluZyk7XG4gIGxldCB2YWx1ZSA9ICFub2RlLmluaXQgPyBrZXkgOlxuICAgICAge1xuICAgICAgICB0eXBlOiBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIsXG4gICAgICAgIGxlZnQ6IGtleSxcbiAgICAgICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5pbml0KVxuICAgICAgfTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAgbWV0aG9kOiBmYWxzZSxcbiAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiB0cnVlLFxuICAgIGtleSxcbiAgICB2YWx1ZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0QmluZGluZyhub2RlKSB7XG4gcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFBhdHRlcm5cIixcbiAgICBwcm9wZXJ0aWVzOiBub2RlLnByb3BlcnRpZXMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNsYXNzRGVjbGFyYXRpb25cIixcbiAgICBpZDogY29udmVydChub2RlLm5hbWUpLFxuICAgIHN1cGVyQ2xhc3M6IGNvbnZlcnQobm9kZS5zdXBlciksXG4gICAgYm9keToge1xuICAgICAgdHlwZTogXCJDbGFzc0JvZHlcIixcbiAgICAgIGJvZHk6IG5vZGUuZWxlbWVudHMubWFwKGNvbnZlcnQpXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2xhc3NFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IGV4cHJlc3Npb24gPSBjb252ZXJ0Q2xhc3NEZWNsYXJhdGlvbihub2RlKTtcbiAgZXhwcmVzc2lvbi50eXBlID0gXCJDbGFzc0V4cHJlc3Npb25cIjtcbiAgcmV0dXJuIGV4cHJlc3Npb247XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBcnJheUJpbmRpbmcobm9kZSkge1xuICBsZXQgZWx0cyA9IG5vZGUuZWxlbWVudHMubWFwKHYgPT4ge1xuICAgIGlmKHYgJiYgdi50eXBlID09PSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiKSB7XG4gICAgICByZXR1cm4gY29udmVydEJpbmRpbmdXaXRoRGVmYXVsdCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnQodik7XG4gIH0pO1xuICBpZihub2RlLnJlc3RFbGVtZW50KSBlbHRzLnB1c2goe1xuICAgIHR5cGU6IFwiUmVzdEVsZW1lbnRcIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLnJlc3RFbGVtZW50KVxuICB9KTtcbiAgcmV0dXJuIHsgdHlwZTogXCJBcnJheVBhdHRlcm5cIiwgZWxlbWVudHM6IGVsdHMgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBrZXk6IGNvbnZlcnQobm9kZS5uYW1lKSxcbiAgICB2YWx1ZTogY29udmVydChub2RlLmJpbmRpbmcpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBcnJvd0V4cHJlc3Npb24obm9kZSkgIHtcbiAgbGV0IGJvZHkgPSBjb252ZXJ0KG5vZGUuYm9keSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiLFxuICAgIGlkOiBudWxsLFxuICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgZXhwcmVzc2lvbjogYm9keS50eXBlICE9PSBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzKHBzKSB7XG4gIGxldCBwYXJhbXMgPSBwcy5pdGVtcy5tYXAoY29udmVydCk7XG4gIGlmKHBzLml0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICBpZihwcy5yZXN0ICE9IG51bGwpIHtcbiAgICAgIHBhcmFtcy5wdXNoKHsgdHlwZTogXCJSZXN0RWxlbWVudFwiLCBhcmd1bWVudDogY29udmVydChwcy5yZXN0KSB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhcmFtcztcbn1cblxuZnVuY3Rpb24gY29udmVydENvbnN0cnVjdG9yKG0pIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNsYXNzTWV0aG9kXCIsXG4gICAga2V5OiBjb252ZXJ0KG0ubmFtZSksXG4gICAgY29tcHV0ZWQ6IG0ubmFtZS50eXBlID09PSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsXG4gICAga2luZDogbS5uYW1lLnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIgPyBcImNvbnN0cnVjdG9yXCIgOiBcImluaXRcIixcbiAgICBzdGF0aWM6IGZhbHNlLFxuICAgIGlkOiBudWxsLFxuICAgIHBhcmFtczogY29udmVydEZvcm1hbFBhcmFtZXRlcnMobS5wYXJhbXMpLFxuICAgIGdlbmVyYXRvcjogbS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZSxcbiAgICBib2R5OiBjb252ZXJ0KG0uYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRWxlbWVudChub2RlKSB7XG4gIHJldHVybiBjb252ZXJ0KG5vZGUubWV0aG9kKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFNwcmVhZEVsZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN1cGVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN1cGVyXCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRlbXBsYXRlRXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCBxdWFzaXMgPSBbXSxcbiAgICAgIGV4cHJlc3Npb25zID0gW107XG4gIG5vZGUuZWxlbWVudHMuZm9yRWFjaCgodixpKSA9PiB7XG4gICAgaWYoaSAlIDIgPT09IDApIHF1YXNpcy5wdXNoKGNvbnZlcnQodikpO1xuICAgIGVsc2UgZXhwcmVzc2lvbnMucHVzaChjb252ZXJ0KHYpKTtcbiAgfSk7XG4gIHF1YXNpc1txdWFzaXMubGVuZ3RoLTFdLnRhaWwgPSB0cnVlO1xuXG4gIGlmKG5vZGUudGFnICE9IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb25cIixcbiAgICAgIHRhZzogY29udmVydChub2RlLnRhZyksXG4gICAgICBxdWFzaToge1xuICAgICAgICB0eXBlOiBcIlRlbXBsYXRlTGl0ZXJhbFwiLFxuICAgICAgICBxdWFzaXMsXG4gICAgICAgIGV4cHJlc3Npb25zXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVGVtcGxhdGVMaXRlcmFsXCIsXG4gICAgcXVhc2lzLFxuICAgIGV4cHJlc3Npb25zXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVGVtcGxhdGVFbGVtZW50XCIsXG4gICAgdmFsdWU6IHtcbiAgICAgIHJhdzogbm9kZS5yYXdWYWx1ZSxcbiAgICAgIGNvb2tlZDogbm9kZS5yYXdWYWx1ZVxuICAgIH0sXG4gICAgdGFpbDogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFlpZWxkRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJZaWVsZEV4cHJlc3Npb25cIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLmV4cHJlc3Npb24pLFxuICAgIGRlbGVnYXRlOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0WWllbGRHZW5lcmF0b3JFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IGV4cHIgPSBjb252ZXJ0WWllbGRFeHByZXNzaW9uKG5vZGUpO1xuICBleHByLmRlbGVnYXRlID0gdHJ1ZTtcbiAgcmV0dXJuIGV4cHI7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnRBbGxGcm9tKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydEFsbERlY2xhcmF0aW9uXCIsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydEZyb20obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0TmFtZWREZWNsYXJhdGlvblwiLFxuICAgIGRlY2xhcmF0aW9uOiBudWxsLFxuICAgIHNvdXJjZToge1xuICAgICAgdHlwZTogXCJTdHJpbmdMaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogbm9kZS5tb2R1bGVTcGVjaWZpZXJcbiAgICB9LFxuICAgIHNwZWNpZmllcnM6IG5vZGUubmFtZWRFeHBvcnRzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0U3BlY2lmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydFNwZWNpZmllclwiLFxuICAgIGV4cG9ydGVkOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUuZXhwb3J0ZWROYW1lKSxcbiAgICBsb2NhbDogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUgIT0gbnVsbCA/IG5vZGUubmFtZSA6IG5vZGUuZXhwb3J0ZWROYW1lKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydE5hbWVkRGVjbGFyYXRpb25cIixcbiAgICBkZWNsYXJhdGlvbjogY29udmVydChub2RlLmRlY2xhcmF0aW9uKSxcbiAgICBzcGVjaWZpZXJzOiBbXSxcbiAgICBzb3VyY2U6IG51bGxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydERlZmF1bHQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uXCIsXG4gICAgZGVjbGFyYXRpb246IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0KG5vZGUpIHtcbiAgbGV0IHNwZWNpZmllcnMgPSBub2RlLm5hbWVkSW1wb3J0cy5tYXAoY29udmVydCk7XG4gIGlmKG5vZGUuZGVmYXVsdEJpbmRpbmcpXG4gICAgc3BlY2lmaWVycy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6IFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiLFxuICAgICAgbG9jYWw6IGNvbnZlcnQobm9kZS5kZWZhdWx0QmluZGluZylcbiAgICB9KTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkltcG9ydERlY2xhcmF0aW9uXCIsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH0sXG4gICAgc3BlY2lmaWVyc1xuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0TmFtZXNwYWNlKG5vZGUpIHtcbiAgbGV0IHNwZWNpZmllcnMgPSBbe1xuICAgIHR5cGU6IFwiSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyXCIsXG4gICAgbG9jYWw6IGNvbnZlcnQobm9kZS5uYW1lc3BhY2VCaW5kaW5nKVxuICB9XTtcbiAgaWYobm9kZS5kZWZhdWx0QmluZGluZyAhPSBudWxsKSB7XG4gICAgc3BlY2lmaWVycy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6IFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiLFxuICAgICAgbG9jYWw6IGNvbnZlcnQobm9kZS5kZWZhdWx0QmluZGluZylcbiAgICB9KTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSW1wb3J0RGVjbGFyYXRpb25cIixcbiAgICBzb3VyY2U6IHtcbiAgICAgIHR5cGU6IFwiU3RyaW5nTGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IG5vZGUubW9kdWxlU3BlY2lmaWVyXG4gICAgfSxcbiAgICBzcGVjaWZpZXJzXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnRTcGVjaWZpZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSW1wb3J0U3BlY2lmaWVyXCIsXG4gICAgbG9jYWw6IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICBpbXBvcnRlZDogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUgfHwgbm9kZS5iaW5kaW5nLm5hbWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTaG9ydGhhbmRQcm9wZXJ0eShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RQcm9wZXJ0eVwiLFxuICAgIHNob3J0aGFuZDogdHJ1ZSxcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICBrZXk6IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5uYW1lKSxcbiAgICB2YWx1ZTogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb21wb3VuZEFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCIsXG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgbGVmdDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuY29uc3QgQ29udmVydCA9IHtcbiAgLy8gYmluZGluZ3NcbiAgQmluZGluZ1dpdGhEZWZhdWx0OiBjb252ZXJ0QmluZGluZ1dpdGhEZWZhdWx0LFxuICBCaW5kaW5nSWRlbnRpZmllcjogY29udmVydEJpbmRpbmdJZGVudGlmaWVyLFxuICBBcnJheUJpbmRpbmc6IGNvbnZlcnRBcnJheUJpbmRpbmcsXG4gIE9iamVjdEJpbmRpbmc6IGNvbnZlcnRPYmplY3RCaW5kaW5nLFxuICBCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyOiBjb252ZXJ0QmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcixcbiAgQmluZGluZ1Byb3BlcnR5UHJvcGVydHk6IGNvbnZlcnRCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eSxcblxuICAvLyBjbGFzc2VzXG4gIENsYXNzRXhwcmVzc2lvbjogY29udmVydENsYXNzRXhwcmVzc2lvbixcbiAgQ2xhc3NEZWNsYXJhdGlvbjogY29udmVydENsYXNzRGVjbGFyYXRpb24sXG4gIENsYXNzRWxlbWVudDogY29udmVydENsYXNzRWxlbWVudCxcblxuICAvLyBtb2R1bGVzXG4gIE1vZHVsZTogY29udmVydE1vZHVsZSxcbiAgSW1wb3J0OiBjb252ZXJ0SW1wb3J0LFxuICBJbXBvcnROYW1lc3BhY2U6IGNvbnZlcnRJbXBvcnROYW1lc3BhY2UsXG4gIEltcG9ydFNwZWNpZmllcjogY29udmVydEltcG9ydFNwZWNpZmllcixcbiAgRXhwb3J0QWxsRnJvbTogY29udmVydEV4cG9ydEFsbEZyb20sXG4gIEV4cG9ydEZyb206IGNvbnZlcnRFeHBvcnRGcm9tLFxuICBFeHBvcnQ6IGNvbnZlcnRFeHBvcnQsXG4gIEV4cG9ydERlZmF1bHQ6IGNvbnZlcnRFeHBvcnREZWZhdWx0LFxuICBFeHBvcnRTcGVjaWZpZXI6IGNvbnZlcnRFeHBvcnRTcGVjaWZpZXIsXG5cbiAgLy8gcHJvcGVydHkgZGVmaW5pdGlvblxuICBNZXRob2Q6IGNvbnZlcnRNZXRob2QsXG4gIEdldHRlcjogY29udmVydEdldHRlcixcbiAgU2V0dGVyOiBjb252ZXJ0U2V0dGVyLFxuICBEYXRhUHJvcGVydHk6IGNvbnZlcnREYXRhUHJvcGVydHksXG4gIFNob3J0aGFuZFByb3BlcnR5OiBjb252ZXJ0U2hvcnRoYW5kUHJvcGVydHksXG4gIENvbXB1dGVkUHJvcGVydHlOYW1lOiBjb252ZXJ0Q29tcHV0ZWRQcm9wZXJ0eU5hbWUsXG4gIFN0YXRpY1Byb3BlcnR5TmFtZTogY29udmVydFN0YXRpY1Byb3BlcnR5TmFtZSxcblxuICAvLyBsaXRlcmFsc1xuICBMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24sXG4gIExpdGVyYWxJbmZpbml0eUV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uLFxuICBMaXRlcmFsTnVsbEV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsTnVsbEV4cHJlc3Npb24sXG4gIExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbixcbiAgTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbixcbiAgTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbixcblxuICAvLyBvdGhlciBleHByZXNzaW9uc1xuICBBcnJheUV4cHJlc3Npb246IGNvbnZlcnRBcnJheUV4cHJlc3Npb24sXG4gIEFycm93RXhwcmVzc2lvbjogY29udmVydEFycm93RXhwcmVzc2lvbixcbiAgQXNzaWdubWVudEV4cHJlc3Npb246IGNvbnZlcnRBc3NpZ25tZW50RXhwcmVzc2lvbixcbiAgQmluYXJ5RXhwcmVzc2lvbjogY29udmVydEJpbmFyeUV4cHJlc3Npb24sXG4gIENhbGxFeHByZXNzaW9uOiBjb252ZXJ0Q2FsbEV4cHJlc3Npb24sXG4gIENvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb246IGNvbnZlcnRDb21wb3VuZEFzc2lnbm1lbnRFeHByZXNzaW9uLFxuICBDb21wdXRlZE1lbWJlckV4cHJlc3Npb246IGNvbnZlcnRDb21wdXRlZE1lbWJlckV4cHJlc3Npb24sXG4gIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogY29udmVydENvbmRpdGlvbmFsRXhwcmVzc2lvbixcbiAgRnVuY3Rpb25FeHByZXNzaW9uOiBjb252ZXJ0RnVuY3Rpb25FeHByZXNzaW9uLFxuICBJZGVudGlmaWVyRXhwcmVzc2lvbjogY29udmVydElkZW50aWZpZXJFeHByZXNzaW9uLFxuICBOZXdFeHByZXNzaW9uOiBjb252ZXJ0TmV3RXhwcmVzc2lvbixcbiAgTmV3VGFyZ2V0RXhwcmVzc2lvbjogY29udmVydE5ld1RhcmdldEV4cHJlc3Npb24sXG4gIE9iamVjdEV4cHJlc3Npb246IGNvbnZlcnRPYmplY3RFeHByZXNzaW9uLFxuICBVbmFyeUV4cHJlc3Npb246IGNvbnZlcnRVbmFyeUV4cHJlc3Npb24sXG4gIFN0YXRpY01lbWJlckV4cHJlc3Npb246IGNvbnZlcnRTdGF0aWNNZW1iZXJFeHByZXNzaW9uLFxuICBUZW1wbGF0ZUV4cHJlc3Npb246IGNvbnZlcnRUZW1wbGF0ZUV4cHJlc3Npb24sXG4gIFRoaXNFeHByZXNzaW9uOiBjb252ZXJ0VGhpc0V4cHJlc3Npb24sXG4gIFVwZGF0ZUV4cHJlc3Npb246IGNvbnZlcnRVcGRhdGVFeHByZXNzaW9uLFxuICBZaWVsZEV4cHJlc3Npb246IGNvbnZlcnRZaWVsZEV4cHJlc3Npb24sXG4gIFlpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbjogY29udmVydFlpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbixcblxuXG4gIC8vIG90aGVyIHN0YXRlbWVudHNcbiAgQmxvY2tTdGF0ZW1lbnQ6IGNvbnZlcnRCbG9ja1N0YXRlbWVudCxcbiAgQnJlYWtTdGF0ZW1lbnQ6IGNvbnZlcnRCcmVha1N0YXRlbWVudCxcbiAgQ29udGludWVTdGF0ZW1lbnQ6IGNvbnZlcnRDb250aW51ZVN0YXRlbWVudCxcbiAgRGVidWdnZXJTdGF0ZW1lbnQ6IGNvbnZlcnREZWJ1Z2dlclN0YXRlbWVudCxcbiAgRG9XaGlsZVN0YXRlbWVudDogY29udmVydERvV2hpbGVTdGF0ZW1lbnQsXG4gIEVtcHR5U3RhdGVtZW50OiBjb252ZXJ0RW1wdHlTdGF0ZW1lbnQsXG4gIEV4cHJlc3Npb25TdGF0ZW1lbnQ6IGNvbnZlcnRFeHByZXNzaW9uU3RhdGVtZW50LFxuICBGb3JJblN0YXRlbWVudDogY29udmVydEZvckluU3RhdGVtZW50LFxuICBGb3JPZlN0YXRlbWVudDogY29udmVydEZvck9mU3RhdGVtZW50LFxuICBGb3JTdGF0ZW1lbnQ6IGNvbnZlcnRGb3JTdGF0ZW1lbnQsXG4gIElmU3RhdGVtZW50OiBjb252ZXJ0SWZTdGF0ZW1lbnQsXG4gIExhYmVsZWRTdGF0ZW1lbnQ6IGNvbnZlcnRMYWJlbGVkU3RhdGVtZW50LFxuICBSZXR1cm5TdGF0ZW1lbnQ6IGNvbnZlcnRSZXR1cm5TdGF0ZW1lbnQsXG4gIFN3aXRjaFN0YXRlbWVudDogY29udmVydFN3aXRjaFN0YXRlbWVudCxcbiAgU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQ6IGNvbnZlcnRTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdCxcbiAgVGhyb3dTdGF0ZW1lbnQ6IGNvbnZlcnRUaHJvd1N0YXRlbWVudCxcbiAgVHJ5Q2F0Y2hTdGF0ZW1lbnQ6IGNvbnZlcnRUcnlDYXRjaFN0YXRlbWVudCxcbiAgVHJ5RmluYWxseVN0YXRlbWVudDogY29udmVydFRyeUZpbmFsbHlTdGF0ZW1lbnQsXG4gIFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQ6IGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50LFxuICBXaGlsZVN0YXRlbWVudDogY29udmVydFdoaWxlU3RhdGVtZW50LFxuICBXaXRoU3RhdGVtZW50OiBjb252ZXJ0V2l0aFN0YXRlbWVudCxcblxuICAvLyBvdGhlciBub2Rlc1xuICBCbG9jazogY29udmVydEJsb2NrLFxuICBDYXRjaENsYXVzZTogY29udmVydENhdGNoQ2xhdXNlLFxuICBEaXJlY3RpdmU6IGNvbnZlcnREaXJlY3RpdmUsXG4gIEZvcm1hbFBhcmFtZXRlcnM6IGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzLFxuICBGdW5jdGlvbkJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHksXG4gIEZ1bmN0aW9uRGVjbGFyYXRpb246IGNvbnZlcnRGdW5jdGlvbkRlY2xhcmF0aW9uLFxuICBTY3JpcHQ6IGNvbnZlcnRTY3JpcHQsXG4gIFNwcmVhZEVsZW1lbnQ6IGNvbnZlcnRTcHJlYWRFbGVtZW50LFxuICBTdXBlcjogY29udmVydFN1cGVyLFxuICBTd2l0Y2hDYXNlOiBjb252ZXJ0U3dpdGNoQ2FzZSxcbiAgU3dpdGNoRGVmYXVsdDogY29udmVydFN3aXRjaERlZmF1bHQsXG4gIFRlbXBsYXRlRWxlbWVudDogY29udmVydFRlbXBsYXRlRWxlbWVudCxcbiAgVmFyaWFibGVEZWNsYXJhdGlvbjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24sXG4gIFZhcmlhYmxlRGVjbGFyYXRvcjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRvclxufTtcblxuIl19