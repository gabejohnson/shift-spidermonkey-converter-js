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
    type: "Literal",
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
    if (v.type === "BindingWithDefault") {
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

function convertClassElement(node) {
  var m = node.method;
  return {
    type: "ClassMethod",
    key: convert(m.name),
    computed: m.name.type === "ComputedPropertyName",
    kind: m.name.value === "constructor" ? "constructor" : "init",
    static: node.isStatic,
    id: null,
    params: convertFormalParameters(m.params),
    generator: m.isGenerator,
    expression: false,
    body: convert(m.body)
  };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90by1zcGlkZXJtb25rZXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBa0J3QixPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVQsU0FBUyxPQUFULENBQWlCLEdBQWpCLEVBQXNCO0FBQ25DLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2YsV0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBTyxRQUFRLElBQUksSUFBWixFQUFrQixHQUFsQixDQUFQO0FBQ0Q7O0FBRUQsU0FBUyx5QkFBVCxDQUFtQyxJQUFuQyxFQUF5QztBQUN2QyxTQUFPO0FBQ0wsVUFBTSxtQkFERDtBQUVMLFVBQU0sUUFBUSxLQUFLLE9BQWIsQ0FGRDtBQUdMLFdBQU8sUUFBUSxLQUFLLElBQWI7QUFIRixHQUFQO0FBS0Q7O0FBRUQsU0FBUyxtQkFBVCxDQUE2QixJQUE3QixFQUFtQztBQUNqQyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGdCQUFZLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQsRUFGeEQ7QUFHTCxVQUFNLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQ7QUFIbEQsR0FBUDtBQUtEOztBQUVELFNBQVMsMEJBQVQsQ0FBb0MsSUFBcEMsRUFBMEM7QUFDeEMsU0FBTztBQUNMLFVBQU0scUJBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBSEg7QUFJTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBSkQ7QUFLTCxlQUFXLEtBQUssV0FMWDtBQU1MLGdCQUFZO0FBTlAsR0FBUDtBQVFEOztBQUVELFNBQVMseUJBQVQsQ0FBbUMsSUFBbkMsRUFBeUM7QUFDdkMsU0FBTztBQUNMLFVBQU0sb0JBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFR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Qix1QkE1Rko7QUE2RmQsZ0JBQWMsbUJBN0ZBO0FBOEZkLHVCQUFxQiwwQkE5RlA7QUErRmQsVUFBUSxhQS9GTTtBQWdHZCxpQkFBZSxvQkFoR0Q7QUFpR2QsU0FBTyxZQWpHTztBQWtHZCxjQUFZLGlCQWxHRTtBQW1HZCxpQkFBZSxvQkFuR0Q7QUFvR2QsbUJBQWlCLHNCQXBHSDtBQXFHZCx1QkFBcUIsMEJBckdQO0FBc0dkLHNCQUFvQjtBQXRHTixDQUFoQiIsImZpbGUiOiJ0by1zcGlkZXJtb25rZXkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gY29udmVydCBTaGlmdCBBU1QgZm9ybWF0IHRvIEJhYnlsb24gQVNUIGZvcm1hdFxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0KGFzdCkge1xuICBpZiAoYXN0ID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBDb252ZXJ0W2FzdC50eXBlXShhc3QpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluZGluZ1dpdGhEZWZhdWx0KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFzc2lnbm1lbnRQYXR0ZXJuXCIsXG4gICAgbGVmdDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuaW5pdClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uQm9keShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLFxuICAgIGRpcmVjdGl2ZXM6IG5vZGUuZGlyZWN0aXZlcyA/IG5vZGUuZGlyZWN0aXZlcy5tYXAoY29udmVydCkgOiBbXSxcbiAgICBib2R5OiBub2RlLnN0YXRlbWVudHMgPyBub2RlLnN0YXRlbWVudHMubWFwKGNvbnZlcnQpIDogW11cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogbm9kZS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogbm9kZS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RFeHByZXNzaW9uXCIsXG4gICAgcHJvcGVydGllczogbm9kZS5wcm9wZXJ0aWVzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0R2V0dGVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdE1ldGhvZFwiLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICBpZDogbnVsbCxcbiAgICBwYXJhbXM6IFtdLFxuICAgIGJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZS5ib2R5KSxcbiAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBraW5kOiBcImdldFwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTZXR0ZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0TWV0aG9kXCIsXG4gICAga2V5OiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgY29tcHV0ZWQ6IG5vZGUubmFtZS50eXBlID09PSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBbY29udmVydChub2RlLnBhcmFtKV0sXG4gICAgYm9keTogY29udmVydEZ1bmN0aW9uQm9keShub2RlLmJvZHkpLFxuICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgZXhwcmVzc2lvbjogZmFsc2UsXG4gICAgbWV0aG9kOiBmYWxzZSxcbiAgICBzaG9ydGhhbmQ6IGZhbHNlLFxuICAgIGtpbmQ6IFwic2V0XCJcbiAgfTtcbn1cbmZ1bmN0aW9uIGNvbnZlcnRNZXRob2Qobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0TWV0aG9kXCIsXG4gICAga2V5OiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgY29tcHV0ZWQ6IG5vZGUubmFtZS50eXBlID09PSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsXG4gICAga2luZDogXCJtZXRob2RcIixcbiAgICBtZXRob2Q6IHRydWUsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBpZDogbnVsbCxcbiAgICBwYXJhbXM6IGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzKG5vZGUucGFyYW1zKSxcbiAgICBnZW5lcmF0b3I6IG5vZGUuaXNHZW5lcmF0b3IsXG4gICAgZXhwcmVzc2lvbjogZmFsc2UsXG4gICAgYm9keTogY29udmVydEZ1bmN0aW9uQm9keShub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREYXRhUHJvcGVydHkobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0UHJvcGVydHlcIixcbiAgICBrZXk6IGNvbnZlcnQobm9kZS5uYW1lKSxcbiAgICB2YWx1ZTogY29udmVydChub2RlLmV4cHJlc3Npb24pLFxuICAgIGNvbXB1dGVkOiBub2RlLm5hbWUudHlwZSA9PT0gXCJDb21wdXRlZFByb3BlcnR5TmFtZVwiLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q29tcHV0ZWRQcm9wZXJ0eU5hbWUobm9kZSkge1xuICByZXR1cm4gY29udmVydChub2RlLmV4cHJlc3Npb24pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICBjYXNlIFwiU3RhdGljUHJvcGVydHlOYW1lXCI6XG4gICAgICByZXR1cm4gY29udmVydFN0YXRpY1Byb3BlcnR5TmFtZShub2RlKTtcbiAgICBjYXNlIFwiQ29tcHV0ZWRQcm9wZXJ0eU5hbWVcIjpcbiAgICAgIHJldHVybiBjb252ZXJ0Q29tcHV0ZWRQcm9wZXJ0eU5hbWUobm9kZSk7XG4gICAgY2FzZSBcIlNob3J0aGFuZFByb3BlcnR5XCI6XG4gICAgICByZXR1cm4gY29udmVydFNob3J0aGFuZFByb3BlcnR5KG5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQm9vbGVhbkxpdGVyYWxcIixcbiAgICB2YWx1ZTogbm9kZS52YWx1ZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbE51bGxFeHByZXNzaW9uKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTnVsbExpdGVyYWxcIlxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk51bWVyaWNMaXRlcmFsXCIsXG4gICAgdmFsdWU6IHBhcnNlRmxvYXQobm9kZS52YWx1ZSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxJbmZpbml0eUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTGl0ZXJhbFwiLFxuICAgIHZhbHVlOiAxIC8gMFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiUmVnRXhwTGl0ZXJhbFwiLFxuICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgcGF0dGVybjogbm9kZS5wYXR0ZXJuLFxuICAgIGZsYWdzOiBub2RlLmZsYWdzXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJTdHJpbmdMaXRlcmFsXCIsXG4gICAgdmFsdWU6IG5vZGUudmFsdWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFycmF5RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJBcnJheUV4cHJlc3Npb25cIixcbiAgICBlbGVtZW50czogbm9kZS5lbGVtZW50cy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCIsXG4gICAgb3BlcmF0b3I6IFwiPVwiLFxuICAgIGxlZnQ6IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICByaWdodDogY29udmVydChub2RlLmV4cHJlc3Npb24pXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTZXF1ZW5jZUV4cHJlc3Npb25Ub0FycmF5KG5vZGUpIHtcbiAgbGV0IGFycmF5ID0gW107XG4gIGlmIChub2RlLmxlZnQudHlwZSA9PT0gXCJCaW5hcnlFeHByZXNzaW9uXCIgJiYgbm9kZS5sZWZ0Lm9wZXJhdG9yID09PSBcIixcIikge1xuICAgIGFycmF5ID0gY29udmVydFNlcXVlbmNlRXhwcmVzc2lvblRvQXJyYXkobm9kZS5sZWZ0KTtcbiAgfSBlbHNlIHtcbiAgICBhcnJheSA9IFtjb252ZXJ0KG5vZGUubGVmdCldO1xuICB9XG4gIGFycmF5LnB1c2goY29udmVydChub2RlLnJpZ2h0KSk7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmFyeUV4cHJlc3Npb24obm9kZSkge1xuICBpZiAobm9kZS5vcGVyYXRvciA9PT0gXCIsXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJTZXF1ZW5jZUV4cHJlc3Npb25cIixcbiAgICAgIGV4cHJlc3Npb25zOiBjb252ZXJ0U2VxdWVuY2VFeHByZXNzaW9uVG9BcnJheShub2RlKVxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBub2RlLm9wZXJhdG9yID09PSBcInx8XCIgfHwgbm9kZS5vcGVyYXRvciA9PT0gXCImJlwiID8gXCJMb2dpY2FsRXhwcmVzc2lvblwiIDogXCJCaW5hcnlFeHByZXNzaW9uXCIsXG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgbGVmdDogY29udmVydChub2RlLmxlZnQpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUucmlnaHQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDYWxsRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDYWxsRXhwcmVzc2lvblwiLFxuICAgIGNhbGxlZTogY29udmVydChub2RlLmNhbGxlZSksXG4gICAgYXJndW1lbnRzOiBub2RlLmFyZ3VtZW50cy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgb2JqZWN0OiBjb252ZXJ0KG5vZGUub2JqZWN0KSxcbiAgICBwcm9wZXJ0eTogY29udmVydChub2RlLmV4cHJlc3Npb24pLFxuICAgIGNvbXB1dGVkOiB0cnVlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb25kaXRpb25hbEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCIsXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpLFxuICAgIGFsdGVybmF0ZTogY29udmVydChub2RlLmFsdGVybmF0ZSksXG4gICAgY29uc2VxdWVudDogY29udmVydChub2RlLmNvbnNlcXVlbnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUlkZW50aWZpZXIobmFtZSkge1xuICBpZihuYW1lID09IG51bGwpIHRocm93IEVycm9yKFwiQW4gaWRlbnRpZmllciBtdXN0IGhhdmUgYSBuYW1lIVwiKTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICBuYW1lOiBuYW1lXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROZXdFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk5ld0V4cHJlc3Npb25cIixcbiAgICBjYWxsZWU6IGNvbnZlcnQobm9kZS5jYWxsZWUpLFxuICAgIGFyZ3VtZW50czogbm9kZS5hcmd1bWVudHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTdGF0aWNNZW1iZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIixcbiAgICBvYmplY3Q6IGNvbnZlcnQobm9kZS5vYmplY3QpLFxuICAgIHByb3BlcnR5OiBjcmVhdGVJZGVudGlmaWVyKG5vZGUucHJvcGVydHkpLFxuICAgIGNvbXB1dGVkOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGhpc0V4cHJlc3Npb24oKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUaGlzRXhwcmVzc2lvblwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCbG9ja1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBjb252ZXJ0QmxvY2sobm9kZS5ibG9jayk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCcmVha1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCcmVha1N0YXRlbWVudFwiLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsID8gY3JlYXRlSWRlbnRpZmllcihub2RlLmxhYmVsKSA6IG51bGxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbnRpbnVlU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNvbnRpbnVlU3RhdGVtZW50XCIsXG4gICAgbGFiZWw6IG5vZGUubGFiZWwgPyBjcmVhdGVJZGVudGlmaWVyKG5vZGUubGFiZWwpIDogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJEZWJ1Z2dlclN0YXRlbWVudFwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREb1doaWxlU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkRvV2hpbGVTdGF0ZW1lbnRcIixcbiAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFbXB0eVN0YXRlbWVudCgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkVtcHR5U3RhdGVtZW50XCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLFxuICAgIGV4cHJlc3Npb246IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Rm9ySW5TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRm9ySW5TdGF0ZW1lbnRcIixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUubGVmdCksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5yaWdodCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Rm9yU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZvclN0YXRlbWVudFwiLFxuICAgIGluaXQ6IGNvbnZlcnQobm9kZS5pbml0KSxcbiAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgdXBkYXRlOiBjb252ZXJ0KG5vZGUudXBkYXRlKSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydElmU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIklmU3RhdGVtZW50XCIsXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpLFxuICAgIGNvbnNlcXVlbnQ6IGNvbnZlcnQobm9kZS5jb25zZXF1ZW50KSxcbiAgICBhbHRlcm5hdGU6IGNvbnZlcnQobm9kZS5hbHRlcm5hdGUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMYWJlbGVkU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkxhYmVsZWRTdGF0ZW1lbnRcIixcbiAgICBsYWJlbDogY3JlYXRlSWRlbnRpZmllcihub2RlLmxhYmVsKSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFJldHVyblN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJSZXR1cm5TdGF0ZW1lbnRcIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLmV4cHJlc3Npb24pXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTd2l0Y2hTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50XCIsXG4gICAgZGlzY3JpbWluYW50OiBjb252ZXJ0KG5vZGUuZGlzY3JpbWluYW50KSxcbiAgICBjYXNlczogbm9kZS5jYXNlcy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN3aXRjaFN0YXRlbWVudFwiLFxuICAgIGRpc2NyaW1pbmFudDogY29udmVydChub2RlLmRpc2NyaW1pbmFudCksXG4gICAgY2FzZXM6IG5vZGUucHJlRGVmYXVsdENhc2VzLm1hcChjb252ZXJ0KS5cbiAgICAgICAgY29uY2F0KGNvbnZlcnQobm9kZS5kZWZhdWx0Q2FzZSkpLlxuICAgICAgICBjb25jYXQobm9kZS5wb3N0RGVmYXVsdENhc2VzLm1hcChjb252ZXJ0KSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRocm93U3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRocm93U3RhdGVtZW50XCIsXG4gICAgYXJndW1lbnQ6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5mdW5jdGlvbiB0b1RyeVN0YXRlbWVudChjb252ZXJ0RmluYWxpemVyLCBub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUcnlTdGF0ZW1lbnRcIixcbiAgICBibG9jazogY29udmVydEJsb2NrKG5vZGUuYm9keSksXG4gICAgaGFuZGxlcjogY29udmVydChub2RlLmNhdGNoQ2xhdXNlKSxcbiAgICBndWFyZGVkSGFuZGxlcnM6IFtdLFxuICAgIGZpbmFsaXplcjogY29udmVydEZpbmFsaXplcihub2RlLmZpbmFsaXplcilcbiAgfTtcbn1cblxubGV0IGNvbnZlcnRUcnlDYXRjaFN0YXRlbWVudCA9IHRvVHJ5U3RhdGVtZW50LmJpbmQobnVsbCwgKCk9Pm51bGwpO1xuXG5sZXQgY29udmVydFRyeUZpbmFsbHlTdGF0ZW1lbnQgPSB0b1RyeVN0YXRlbWVudC5iaW5kKG51bGwsIGNvbnZlcnQpO1xuXG5mdW5jdGlvbiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBjb252ZXJ0KG5vZGUuZGVjbGFyYXRpb24pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0V2hpbGVTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiV2hpbGVTdGF0ZW1lbnRcIixcbiAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRXaXRoU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIldpdGhTdGF0ZW1lbnRcIixcbiAgICBvYmplY3Q6IGNvbnZlcnQobm9kZS5vYmplY3QpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmxvY2sobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQmxvY2tTdGF0ZW1lbnRcIixcbiAgICBkaXJlY3RpdmVzOiBbXSxcbiAgICBib2R5OiBub2RlLnN0YXRlbWVudHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDYXRjaENsYXVzZShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDYXRjaENsYXVzZVwiLFxuICAgIHBhcmFtOiBjb252ZXJ0KG5vZGUuYmluZGluZyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIHRvRmlsZShzb3VyY2VUeXBlLCBib2R5UHJvcCwgbm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRmlsZVwiLFxuICAgIHByb2dyYW06IHtcbiAgICAgIHR5cGU6IFwiUHJvZ3JhbVwiLFxuICAgICAgZGlyZWN0aXZlczogbm9kZS5kaXJlY3RpdmVzLm1hcChjb252ZXJ0KSxcbiAgICAgIGJvZHk6IG5vZGVbYm9keVByb3BdLm1hcChjb252ZXJ0KSxcbiAgICAgIHNvdXJjZVR5cGU6IHNvdXJjZVR5cGVcbiAgICB9XG4gIH07XG59XG5cbmxldCBjb252ZXJ0U2NyaXB0ID0gdG9GaWxlLmJpbmQobnVsbCwgXCJzY3JpcHRcIiwgXCJzdGF0ZW1lbnRzXCIpO1xuXG5sZXQgY29udmVydE1vZHVsZSA9IHRvRmlsZS5iaW5kKG51bGwsIFwibW9kdWxlXCIsIFwiaXRlbXNcIik7XG5cbmZ1bmN0aW9uIHRvU3dpdGNoQ2FzZShjb252ZXJ0Q2FzZSwgbm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3dpdGNoQ2FzZVwiLFxuICAgIHRlc3Q6IGNvbnZlcnRDYXNlKG5vZGUudGVzdCksXG4gICAgY29uc2VxdWVudDogbm9kZS5jb25zZXF1ZW50Lm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5sZXQgY29udmVydFN3aXRjaENhc2UgPSB0b1N3aXRjaENhc2UuYmluZChudWxsLCBjb252ZXJ0KTtcblxubGV0IGNvbnZlcnRTd2l0Y2hEZWZhdWx0ID0gdG9Td2l0Y2hDYXNlLmJpbmQobnVsbCwgKCk9Pm51bGwpO1xuXG5mdW5jdGlvbiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIsXG4gICAgZGVjbGFyYXRpb25zOiBub2RlLmRlY2xhcmF0b3JzLm1hcChjb252ZXJ0KSxcbiAgICBraW5kOiBub2RlLmtpbmRcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFZhcmlhYmxlRGVjbGFyYXRvcihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0b3JcIixcbiAgICBpZDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIGluaXQ6IGNvbnZlcnQobm9kZS5pbml0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluZGluZ0lkZW50aWZpZXIobm9kZSkge1xuICByZXR1cm4gY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RGlyZWN0aXZlKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkRpcmVjdGl2ZVwiLFxuICAgIHZhbHVlOiB7XG4gICAgICB0eXBlOiBcIkRpcmVjdGl2ZUxpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLnJhd1ZhbHVlXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VXBkYXRlRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJVcGRhdGVFeHByZXNzaW9uXCIsXG4gICAgcHJlZml4OiBub2RlLmlzUHJlZml4LFxuICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUub3BlcmFuZClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFVuYXJ5RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJVbmFyeUV4cHJlc3Npb25cIixcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLm9wZXJhbmQpLFxuICAgIHByZWZpeDogdHJ1ZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3RhdGljUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgbGV0IHZhbHVlID0gcGFyc2VGbG9hdChub2RlLnZhbHVlKSB8fCBub2RlLnZhbHVlLFxuICAgICAgdHlwZSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IFwiTnVtZXJpY0xpdGVyYWxcIiA6IFwiU3RyaW5nTGl0ZXJhbFwiO1xuICByZXR1cm4geyB0eXBlLCB2YWx1ZSB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TmV3VGFyZ2V0RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJNZXRhUHJvcGVydHlcIixcbiAgICBtZXRhOiBjcmVhdGVJZGVudGlmaWVyKFwibmV3XCIpLFxuICAgIHByb3BlcnR5OiBjcmVhdGVJZGVudGlmaWVyKFwidGFyZ2V0XCIpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JPZlN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJGb3JPZlN0YXRlbWVudFwiLFxuICAgIGxlZnQ6IGNvbnZlcnQobm9kZS5sZWZ0KSxcbiAgICByaWdodDogY29udmVydChub2RlLnJpZ2h0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZSkge1xuICBsZXQga2V5ID0gY29udmVydChub2RlLmJpbmRpbmcpO1xuICBsZXQgdmFsdWUgPSAhbm9kZS5pbml0ID8ga2V5IDpcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJBc3NpZ25tZW50UGF0dGVyblwiLFxuICAgICAgICBsZWZ0OiBrZXksXG4gICAgICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuaW5pdClcbiAgICAgIH07XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RQcm9wZXJ0eVwiLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgIHNob3J0aGFuZDogdHJ1ZSxcbiAgICBrZXksXG4gICAgdmFsdWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdEJpbmRpbmcobm9kZSkge1xuIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RQYXR0ZXJuXCIsXG4gICAgcHJvcGVydGllczogbm9kZS5wcm9wZXJ0aWVzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2xhc3NEZWNsYXJhdGlvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDbGFzc0RlY2xhcmF0aW9uXCIsXG4gICAgaWQ6IGNvbnZlcnQobm9kZS5uYW1lKSxcbiAgICBzdXBlckNsYXNzOiBjb252ZXJ0KG5vZGUuc3VwZXIpLFxuICAgIGJvZHk6IHtcbiAgICAgIHR5cGU6IFwiQ2xhc3NCb2R5XCIsXG4gICAgICBib2R5OiBub2RlLmVsZW1lbnRzLm1hcChjb252ZXJ0KVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCBleHByZXNzaW9uID0gY29udmVydENsYXNzRGVjbGFyYXRpb24obm9kZSk7XG4gIGV4cHJlc3Npb24udHlwZSA9IFwiQ2xhc3NFeHByZXNzaW9uXCI7XG4gIHJldHVybiBleHByZXNzaW9uO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXJyYXlCaW5kaW5nKG5vZGUpIHtcbiAgbGV0IGVsdHMgPSBub2RlLmVsZW1lbnRzLm1hcCh2ID0+IHtcbiAgICBpZih2LnR5cGUgPT09IFwiQmluZGluZ1dpdGhEZWZhdWx0XCIpIHtcbiAgICAgIHJldHVybiBjb252ZXJ0QmluZGluZ1dpdGhEZWZhdWx0KHYpO1xuICAgIH1cbiAgICByZXR1cm4gY29udmVydCh2KTtcbiAgfSk7XG4gIGlmKG5vZGUucmVzdEVsZW1lbnQpIGVsdHMucHVzaCh7XG4gICAgdHlwZTogXCJSZXN0RWxlbWVudFwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUucmVzdEVsZW1lbnQpXG4gIH0pO1xuICByZXR1cm4geyB0eXBlOiBcIkFycmF5UGF0dGVyblwiLCBlbGVtZW50czogZWx0cyB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluZGluZ1Byb3BlcnR5UHJvcGVydHkobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0UHJvcGVydHlcIixcbiAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgbWV0aG9kOiBmYWxzZSxcbiAgICBzaG9ydGhhbmQ6IGZhbHNlLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIHZhbHVlOiBjb252ZXJ0KG5vZGUuYmluZGluZylcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFycm93RXhwcmVzc2lvbihub2RlKSAge1xuICBsZXQgYm9keSA9IGNvbnZlcnQobm9kZS5ib2R5KTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCIsXG4gICAgaWQ6IG51bGwsXG4gICAgZ2VuZXJhdG9yOiBmYWxzZSxcbiAgICBleHByZXNzaW9uOiBib2R5LnR5cGUgIT09IFwiQmxvY2tTdGF0ZW1lbnRcIixcbiAgICBwYXJhbXM6IGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzKG5vZGUucGFyYW1zKSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvcm1hbFBhcmFtZXRlcnMocHMpIHtcbiAgbGV0IHBhcmFtcyA9IHBzLml0ZW1zLm1hcChjb252ZXJ0KTtcbiAgaWYocHMuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgIGlmKHBzLnJlc3QgIT0gbnVsbCkge1xuICAgICAgcGFyYW1zLnB1c2goeyB0eXBlOiBcIlJlc3RFbGVtZW50XCIsIGFyZ3VtZW50OiBjb252ZXJ0KHBzLnJlc3QpIH0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcGFyYW1zO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2xhc3NFbGVtZW50KG5vZGUpIHtcbiAgbGV0IG0gPSBub2RlLm1ldGhvZDtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNsYXNzTWV0aG9kXCIsXG4gICAga2V5OiBjb252ZXJ0KG0ubmFtZSksXG4gICAgY29tcHV0ZWQ6IG0ubmFtZS50eXBlID09PSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsXG4gICAga2luZDogbS5uYW1lLnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIgPyBcImNvbnN0cnVjdG9yXCIgOiBcImluaXRcIixcbiAgICBzdGF0aWM6IG5vZGUuaXNTdGF0aWMsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhtLnBhcmFtcyksXG4gICAgZ2VuZXJhdG9yOiBtLmlzR2VuZXJhdG9yLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIGJvZHk6IGNvbnZlcnQobS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3ByZWFkRWxlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJTcHJlYWRFbGVtZW50XCIsXG4gICAgYXJndW1lbnQ6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3VwZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3VwZXJcIlxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGVtcGxhdGVFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IHF1YXNpcyA9IFtdLFxuICAgICAgZXhwcmVzc2lvbnMgPSBbXTtcbiAgbm9kZS5lbGVtZW50cy5mb3JFYWNoKCh2LGkpID0+IHtcbiAgICBpZihpICUgMiA9PT0gMCkgcXVhc2lzLnB1c2goY29udmVydCh2KSk7XG4gICAgZWxzZSBleHByZXNzaW9ucy5wdXNoKGNvbnZlcnQodikpO1xuICB9KTtcbiAgcXVhc2lzW3F1YXNpcy5sZW5ndGgtMV0udGFpbCA9IHRydWU7XG5cbiAgaWYobm9kZS50YWcgIT0gbnVsbCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIlRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvblwiLFxuICAgICAgdGFnOiBjb252ZXJ0KG5vZGUudGFnKSxcbiAgICAgIHF1YXNpOiB7XG4gICAgICAgIHR5cGU6IFwiVGVtcGxhdGVMaXRlcmFsXCIsXG4gICAgICAgIHF1YXNpcyxcbiAgICAgICAgZXhwcmVzc2lvbnNcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUZW1wbGF0ZUxpdGVyYWxcIixcbiAgICBxdWFzaXMsXG4gICAgZXhwcmVzc2lvbnNcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRlbXBsYXRlRWxlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUZW1wbGF0ZUVsZW1lbnRcIixcbiAgICB2YWx1ZToge1xuICAgICAgcmF3OiBub2RlLnJhd1ZhbHVlLFxuICAgICAgY29va2VkOiBub2RlLnJhd1ZhbHVlXG4gICAgfSxcbiAgICB0YWlsOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0WWllbGRFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIllpZWxkRXhwcmVzc2lvblwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbiksXG4gICAgZGVsZWdhdGU6IGZhbHNlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24obm9kZSkge1xuICBsZXQgZXhwciA9IGNvbnZlcnRZaWVsZEV4cHJlc3Npb24obm9kZSk7XG4gIGV4cHIuZGVsZWdhdGUgPSB0cnVlO1xuICByZXR1cm4gZXhwcjtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydEFsbEZyb20obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0QWxsRGVjbGFyYXRpb25cIixcbiAgICBzb3VyY2U6IHtcbiAgICAgIHR5cGU6IFwiU3RyaW5nTGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IG5vZGUubW9kdWxlU3BlY2lmaWVyXG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0RnJvbShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJFeHBvcnROYW1lZERlY2xhcmF0aW9uXCIsXG4gICAgZGVjbGFyYXRpb246IG51bGwsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH0sXG4gICAgc3BlY2lmaWVyczogbm9kZS5uYW1lZEV4cG9ydHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnRTcGVjaWZpZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0U3BlY2lmaWVyXCIsXG4gICAgZXhwb3J0ZWQ6IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5leHBvcnRlZE5hbWUpLFxuICAgIGxvY2FsOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSAhPSBudWxsID8gbm9kZS5uYW1lIDogbm9kZS5leHBvcnRlZE5hbWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0TmFtZWREZWNsYXJhdGlvblwiLFxuICAgIGRlY2xhcmF0aW9uOiBjb252ZXJ0KG5vZGUuZGVjbGFyYXRpb24pLFxuICAgIHNwZWNpZmllcnM6IFtdLFxuICAgIHNvdXJjZTogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0RGVmYXVsdChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJFeHBvcnREZWZhdWx0RGVjbGFyYXRpb25cIixcbiAgICBkZWNsYXJhdGlvbjogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnQobm9kZSkge1xuICBsZXQgc3BlY2lmaWVycyA9IG5vZGUubmFtZWRJbXBvcnRzLm1hcChjb252ZXJ0KTtcbiAgaWYobm9kZS5kZWZhdWx0QmluZGluZylcbiAgICBzcGVjaWZpZXJzLnVuc2hpZnQoe1xuICAgICAgdHlwZTogXCJJbXBvcnREZWZhdWx0U3BlY2lmaWVyXCIsXG4gICAgICBsb2NhbDogY29udmVydChub2RlLmRlZmF1bHRCaW5kaW5nKVxuICAgIH0pO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSW1wb3J0RGVjbGFyYXRpb25cIixcbiAgICBzb3VyY2U6IHtcbiAgICAgIHR5cGU6IFwiU3RyaW5nTGl0ZXJhbFwiLFxuICAgICAgdmFsdWU6IG5vZGUubW9kdWxlU3BlY2lmaWVyXG4gICAgfSxcbiAgICBzcGVjaWZpZXJzXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnROYW1lc3BhY2Uobm9kZSkge1xuICBsZXQgc3BlY2lmaWVycyA9IFt7XG4gICAgdHlwZTogXCJJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXJcIixcbiAgICBsb2NhbDogY29udmVydChub2RlLm5hbWVzcGFjZUJpbmRpbmcpXG4gIH1dO1xuICBpZihub2RlLmRlZmF1bHRCaW5kaW5nICE9IG51bGwpIHtcbiAgICBzcGVjaWZpZXJzLnVuc2hpZnQoe1xuICAgICAgdHlwZTogXCJJbXBvcnREZWZhdWx0U3BlY2lmaWVyXCIsXG4gICAgICBsb2NhbDogY29udmVydChub2RlLmRlZmF1bHRCaW5kaW5nKVxuICAgIH0pO1xuICB9XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJJbXBvcnREZWNsYXJhdGlvblwiLFxuICAgIHNvdXJjZToge1xuICAgICAgdHlwZTogXCJTdHJpbmdMaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogbm9kZS5tb2R1bGVTcGVjaWZpZXJcbiAgICB9LFxuICAgIHNwZWNpZmllcnNcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltcG9ydFNwZWNpZmllcihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJJbXBvcnRTcGVjaWZpZXJcIixcbiAgICBsb2NhbDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIGltcG9ydGVkOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSB8fCBub2RlLmJpbmRpbmcubmFtZSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFNob3J0aGFuZFByb3BlcnR5KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAgc2hvcnRoYW5kOiB0cnVlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgIGtleTogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUpLFxuICAgIHZhbHVlOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIixcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUuYmluZGluZyksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5jb25zdCBDb252ZXJ0ID0ge1xuICAvLyBiaW5kaW5nc1xuICBCaW5kaW5nV2l0aERlZmF1bHQ6IGNvbnZlcnRCaW5kaW5nV2l0aERlZmF1bHQsXG4gIEJpbmRpbmdJZGVudGlmaWVyOiBjb252ZXJ0QmluZGluZ0lkZW50aWZpZXIsXG4gIEFycmF5QmluZGluZzogY29udmVydEFycmF5QmluZGluZyxcbiAgT2JqZWN0QmluZGluZzogY29udmVydE9iamVjdEJpbmRpbmcsXG4gIEJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXI6IGNvbnZlcnRCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyLFxuICBCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eTogY29udmVydEJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5LFxuXG4gIC8vIGNsYXNzZXNcbiAgQ2xhc3NFeHByZXNzaW9uOiBjb252ZXJ0Q2xhc3NFeHByZXNzaW9uLFxuICBDbGFzc0RlY2xhcmF0aW9uOiBjb252ZXJ0Q2xhc3NEZWNsYXJhdGlvbixcbiAgQ2xhc3NFbGVtZW50OiBjb252ZXJ0Q2xhc3NFbGVtZW50LFxuXG4gIC8vIG1vZHVsZXNcbiAgTW9kdWxlOiBjb252ZXJ0TW9kdWxlLFxuICBJbXBvcnQ6IGNvbnZlcnRJbXBvcnQsXG4gIEltcG9ydE5hbWVzcGFjZTogY29udmVydEltcG9ydE5hbWVzcGFjZSxcbiAgSW1wb3J0U3BlY2lmaWVyOiBjb252ZXJ0SW1wb3J0U3BlY2lmaWVyLFxuICBFeHBvcnRBbGxGcm9tOiBjb252ZXJ0RXhwb3J0QWxsRnJvbSxcbiAgRXhwb3J0RnJvbTogY29udmVydEV4cG9ydEZyb20sXG4gIEV4cG9ydDogY29udmVydEV4cG9ydCxcbiAgRXhwb3J0RGVmYXVsdDogY29udmVydEV4cG9ydERlZmF1bHQsXG4gIEV4cG9ydFNwZWNpZmllcjogY29udmVydEV4cG9ydFNwZWNpZmllcixcblxuICAvLyBwcm9wZXJ0eSBkZWZpbml0aW9uXG4gIE1ldGhvZDogY29udmVydE1ldGhvZCxcbiAgR2V0dGVyOiBjb252ZXJ0R2V0dGVyLFxuICBTZXR0ZXI6IGNvbnZlcnRTZXR0ZXIsXG4gIERhdGFQcm9wZXJ0eTogY29udmVydERhdGFQcm9wZXJ0eSxcbiAgU2hvcnRoYW5kUHJvcGVydHk6IGNvbnZlcnRTaG9ydGhhbmRQcm9wZXJ0eSxcbiAgQ29tcHV0ZWRQcm9wZXJ0eU5hbWU6IGNvbnZlcnRDb21wdXRlZFByb3BlcnR5TmFtZSxcbiAgU3RhdGljUHJvcGVydHlOYW1lOiBjb252ZXJ0U3RhdGljUHJvcGVydHlOYW1lLFxuXG4gIC8vIGxpdGVyYWxzXG4gIExpdGVyYWxCb29sZWFuRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxCb29sZWFuRXhwcmVzc2lvbixcbiAgTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvbjogY29udmVydExpdGVyYWxJbmZpbml0eUV4cHJlc3Npb24sXG4gIExpdGVyYWxOdWxsRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxOdWxsRXhwcmVzc2lvbixcbiAgTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uOiBjb252ZXJ0TGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uLFxuICBMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxSZWdFeHBFeHByZXNzaW9uLFxuICBMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxTdHJpbmdFeHByZXNzaW9uLFxuXG4gIC8vIG90aGVyIGV4cHJlc3Npb25zXG4gIEFycmF5RXhwcmVzc2lvbjogY29udmVydEFycmF5RXhwcmVzc2lvbixcbiAgQXJyb3dFeHByZXNzaW9uOiBjb252ZXJ0QXJyb3dFeHByZXNzaW9uLFxuICBBc3NpZ25tZW50RXhwcmVzc2lvbjogY29udmVydEFzc2lnbm1lbnRFeHByZXNzaW9uLFxuICBCaW5hcnlFeHByZXNzaW9uOiBjb252ZXJ0QmluYXJ5RXhwcmVzc2lvbixcbiAgQ2FsbEV4cHJlc3Npb246IGNvbnZlcnRDYWxsRXhwcmVzc2lvbixcbiAgQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbjogY29udmVydENvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb24sXG4gIENvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbjogY29udmVydENvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbixcbiAgQ29uZGl0aW9uYWxFeHByZXNzaW9uOiBjb252ZXJ0Q29uZGl0aW9uYWxFeHByZXNzaW9uLFxuICBGdW5jdGlvbkV4cHJlc3Npb246IGNvbnZlcnRGdW5jdGlvbkV4cHJlc3Npb24sXG4gIElkZW50aWZpZXJFeHByZXNzaW9uOiBjb252ZXJ0SWRlbnRpZmllckV4cHJlc3Npb24sXG4gIE5ld0V4cHJlc3Npb246IGNvbnZlcnROZXdFeHByZXNzaW9uLFxuICBOZXdUYXJnZXRFeHByZXNzaW9uOiBjb252ZXJ0TmV3VGFyZ2V0RXhwcmVzc2lvbixcbiAgT2JqZWN0RXhwcmVzc2lvbjogY29udmVydE9iamVjdEV4cHJlc3Npb24sXG4gIFVuYXJ5RXhwcmVzc2lvbjogY29udmVydFVuYXJ5RXhwcmVzc2lvbixcbiAgU3RhdGljTWVtYmVyRXhwcmVzc2lvbjogY29udmVydFN0YXRpY01lbWJlckV4cHJlc3Npb24sXG4gIFRlbXBsYXRlRXhwcmVzc2lvbjogY29udmVydFRlbXBsYXRlRXhwcmVzc2lvbixcbiAgVGhpc0V4cHJlc3Npb246IGNvbnZlcnRUaGlzRXhwcmVzc2lvbixcbiAgVXBkYXRlRXhwcmVzc2lvbjogY29udmVydFVwZGF0ZUV4cHJlc3Npb24sXG4gIFlpZWxkRXhwcmVzc2lvbjogY29udmVydFlpZWxkRXhwcmVzc2lvbixcbiAgWWllbGRHZW5lcmF0b3JFeHByZXNzaW9uOiBjb252ZXJ0WWllbGRHZW5lcmF0b3JFeHByZXNzaW9uLFxuXG5cbiAgLy8gb3RoZXIgc3RhdGVtZW50c1xuICBCbG9ja1N0YXRlbWVudDogY29udmVydEJsb2NrU3RhdGVtZW50LFxuICBCcmVha1N0YXRlbWVudDogY29udmVydEJyZWFrU3RhdGVtZW50LFxuICBDb250aW51ZVN0YXRlbWVudDogY29udmVydENvbnRpbnVlU3RhdGVtZW50LFxuICBEZWJ1Z2dlclN0YXRlbWVudDogY29udmVydERlYnVnZ2VyU3RhdGVtZW50LFxuICBEb1doaWxlU3RhdGVtZW50OiBjb252ZXJ0RG9XaGlsZVN0YXRlbWVudCxcbiAgRW1wdHlTdGF0ZW1lbnQ6IGNvbnZlcnRFbXB0eVN0YXRlbWVudCxcbiAgRXhwcmVzc2lvblN0YXRlbWVudDogY29udmVydEV4cHJlc3Npb25TdGF0ZW1lbnQsXG4gIEZvckluU3RhdGVtZW50OiBjb252ZXJ0Rm9ySW5TdGF0ZW1lbnQsXG4gIEZvck9mU3RhdGVtZW50OiBjb252ZXJ0Rm9yT2ZTdGF0ZW1lbnQsXG4gIEZvclN0YXRlbWVudDogY29udmVydEZvclN0YXRlbWVudCxcbiAgSWZTdGF0ZW1lbnQ6IGNvbnZlcnRJZlN0YXRlbWVudCxcbiAgTGFiZWxlZFN0YXRlbWVudDogY29udmVydExhYmVsZWRTdGF0ZW1lbnQsXG4gIFJldHVyblN0YXRlbWVudDogY29udmVydFJldHVyblN0YXRlbWVudCxcbiAgU3dpdGNoU3RhdGVtZW50OiBjb252ZXJ0U3dpdGNoU3RhdGVtZW50LFxuICBTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdDogY29udmVydFN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0LFxuICBUaHJvd1N0YXRlbWVudDogY29udmVydFRocm93U3RhdGVtZW50LFxuICBUcnlDYXRjaFN0YXRlbWVudDogY29udmVydFRyeUNhdGNoU3RhdGVtZW50LFxuICBUcnlGaW5hbGx5U3RhdGVtZW50OiBjb252ZXJ0VHJ5RmluYWxseVN0YXRlbWVudCxcbiAgVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudDogY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQsXG4gIFdoaWxlU3RhdGVtZW50OiBjb252ZXJ0V2hpbGVTdGF0ZW1lbnQsXG4gIFdpdGhTdGF0ZW1lbnQ6IGNvbnZlcnRXaXRoU3RhdGVtZW50LFxuXG4gIC8vIG90aGVyIG5vZGVzXG4gIEJsb2NrOiBjb252ZXJ0QmxvY2ssXG4gIENhdGNoQ2xhdXNlOiBjb252ZXJ0Q2F0Y2hDbGF1c2UsXG4gIERpcmVjdGl2ZTogY29udmVydERpcmVjdGl2ZSxcbiAgRm9ybWFsUGFyYW1ldGVyczogY29udmVydEZvcm1hbFBhcmFtZXRlcnMsXG4gIEZ1bmN0aW9uQm9keTogY29udmVydEZ1bmN0aW9uQm9keSxcbiAgRnVuY3Rpb25EZWNsYXJhdGlvbjogY29udmVydEZ1bmN0aW9uRGVjbGFyYXRpb24sXG4gIFNjcmlwdDogY29udmVydFNjcmlwdCxcbiAgU3ByZWFkRWxlbWVudDogY29udmVydFNwcmVhZEVsZW1lbnQsXG4gIFN1cGVyOiBjb252ZXJ0U3VwZXIsXG4gIFN3aXRjaENhc2U6IGNvbnZlcnRTd2l0Y2hDYXNlLFxuICBTd2l0Y2hEZWZhdWx0OiBjb252ZXJ0U3dpdGNoRGVmYXVsdCxcbiAgVGVtcGxhdGVFbGVtZW50OiBjb252ZXJ0VGVtcGxhdGVFbGVtZW50LFxuICBWYXJpYWJsZURlY2xhcmF0aW9uOiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvbixcbiAgVmFyaWFibGVEZWNsYXJhdG9yOiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdG9yXG59O1xuXG4iXX0=