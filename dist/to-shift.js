"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
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

exports.default = convert;

var _shiftAst = require("shift-ast");

var Shift = _interopRequireWildcard(_shiftAst);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// convert Babylon AST format to Shift AST format

function convert(node) {
  if (node == null) {
    return null;
  }

  if (!Convert[node.type]) throw Error("Unrecognized type: " + node.type);

  return Convert[node.type](node);
}

function toBinding(node) {
  if (node == null) return null;
  switch (node.type) {
    case "Identifier":
      return new Shift.BindingIdentifier({ name: node.name });
    case "ObjectProperty":
      if (node.shorthand) {
        return new Shift.BindingPropertyIdentifier({
          binding: toBinding(node.key),
          init: toExpression(node.value.right)
        });
      } else {
        return new Shift.BindingPropertyProperty({
          name: toPropertyName(node.key, node.computed),
          binding: toBinding(node.value)
        });
      }
    default:
      return convert(node);
  }
}

function convertAssignmentExpression(node) {
  var binding = toBinding(node.left),
      expression = toExpression(node.right),
      operator = node.operator;
  if (operator === "=") return new Shift.AssignmentExpression({ binding: binding, expression: expression });else return new Shift.CompoundAssignmentExpression({ binding: binding, expression: expression, operator: operator });
}

function convertArrayExpression(node) {
  return new Shift.ArrayExpression({ elements: node.elements.map(convert) });
}

function convertBinaryExpression(node) {
  return new Shift.BinaryExpression({
    operator: node.operator,
    left: convert(node.left),
    right: convert(node.right)
  });
}

function convertBlock(node) {
  return new Shift.Block({ statements: node.body.map(convert) });
}

function convertBlockStatement(node) {
  return new Shift.BlockStatement({ block: convertBlock(node) });
}

function convertBreakStatement(node) {
  return new Shift.BreakStatement({ label: node.label ? node.label.name : null });
}

function toExpression(node) {
  if (node == null) return null;
  switch (node.type) {
    case "Literal":
      return convertLiteral(node);
    case "Identifier":
      return new Shift.IdentifierExpression({ name: node.name });
    case "MetaProperty":
      return new Shift.NewTargetExpression();
    case "TemplateLiteral":
      return convertTemplateLiteral(node);
    case "ObjectMethod":
      return convertObjectMethod(node);
    default:
      return convert(node);
  }
}

function toArgument(node) {
  if (node.type === "SpreadElement") {
    return convertSpreadElement(node);
  }
  return toExpression(node);
}

function convertCallExpression(node) {
  var callee = node.callee.type === "Super" ? convertSuper(node.callee) : toExpression(node.callee);
  return new Shift.CallExpression({ callee: callee, arguments: node.arguments.map(toArgument) });
}

function convertCatchClause(node) {
  return new Shift.CatchClause({
    binding: toBinding(node.param),
    body: convertBlock(node.body)
  });
}

function convertConditionalExpression(node) {
  return new Shift.ConditionalExpression({
    test: toExpression(node.test),
    consequent: toExpression(node.consequent),
    alternate: toExpression(node.alternate)
  });
}

function convertContinueStatement(node) {
  return new Shift.ContinueStatement({ label: node.label ? node.label.name : null });
}

function convertDebuggerStatement() {
  return new Shift.DebuggerStatement();
}

function convertDoWhileStatement(node) {
  return new Shift.DoWhileStatement({
    body: convert(node.body),
    test: convert(node.test)
  });
}

function convertEmptyStatement() {
  return new Shift.EmptyStatement();
}

function convertExpressionStatement(node) {
  return new Shift.ExpressionStatement({ expression: toExpression(node.expression) });
}

function convertForStatement(node) {
  var init = node.init != null && node.init.type === "VariableDeclaration" ? convertVariableDeclaration(node.init, true) : toExpression(node.init);
  return new Shift.ForStatement({
    init: init,
    test: toExpression(node.test),
    update: toExpression(node.update),
    body: convert(node.body)
  });
}

function convertForInStatement(node) {
  var left = node.left.type === "VariableDeclaration" ? convertVariableDeclaration(node.left, true) : toBinding(node.left);
  return new Shift.ForInStatement({
    left: left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function convertForOfStatement(node) {
  var left = node.left.type === "VariableDeclaration" ? convertVariableDeclaration(node.left, true) : toBinding(node.left);
  return new Shift.ForOfStatement({
    left: left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function toFunctionBody(node) {
  return new Shift.FunctionBody({
    directives: node.directives.map(convertDirective),
    statements: node.body.map(convert)
  });
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: toFunctionBody(node.body)
  });
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: toFunctionBody(node.body)
  });
}

function convertIfStatement(node) {
  return new Shift.IfStatement({
    test: toExpression(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertLabeledStatement(node) {
  return new Shift.LabeledStatement({
    label: node.label.name,
    body: convert(node.body)
  });
}

function convertLiteral(node) {
  switch (_typeof(node.value)) {
    case "number":
      if (node.value === 1 / 0) {
        return new Shift.LiteralInfinityExpression();
      }
      return new Shift.LiteralNumericExpression(node);
    case "string":
      return new Shift.LiteralStringExpression(node);
    case "boolean":
      return new Shift.LiteralBooleanExpression(node);
    default:
      if (node.value === null) return new Shift.LiteralNullExpression();else return new Shift.LiteralRegExpExpression(node.regex);
  }
}

function convertBooleanLiteral(node) {
  return new Shift.LiteralBooleanExpression(node);
}

function convertNumericLiteral(node) {
  return new Shift.LiteralNumericExpression(node);
}

function convertStringLiteral(node) {
  return new Shift.LiteralStringExpression(node);
}

function convertRegExpLiteral(node) {
  return new Shift.LiteralRegExpExpression(node);
}

function convertNullLiteral(node) {
  return new Shift.LiteralNullExpression();
}

function convertMemberExpression(node) {
  var obj = node.object.type === "Super" ? convertSuper(node.object) : toExpression(node.object);

  if (node.computed) {
    return new Shift.ComputedMemberExpression({
      object: obj,
      expression: toExpression(node.property)
    });
  } else {
    return new Shift.StaticMemberExpression({
      object: obj,
      property: node.property.name
    });
  }
}

function convertNewExpression(node) {
  return new Shift.NewExpression({
    callee: toArgument(node.callee),
    arguments: node.arguments.map(toArgument)
  });
}

function convertObjectExpression(node) {
  return new Shift.ObjectExpression({ properties: node.properties.map(toExpression) });
}

function convertDirective(node) {
  return new Shift.Directive({ rawValue: node.value.value });
}

function convertProgram(node) {
  var directives = node.directives ? node.directives.map(convertDirective) : [],
      statements = node.body.map(convert);

  if (node.sourceType === "module") {
    return new Shift.Module({ directives: directives, items: statements });
  }
  return new Shift.Script({ directives: directives, statements: statements });
}

function toPropertyName(node, computed) {
  if (computed) {
    return new Shift.ComputedPropertyName({ expression: toExpression(node) });
  } else {
    return new Shift.StaticPropertyName({
      value: node.type === "Identifier" ? node.name : node.value.toString()
    });
  }
}

function convertObjectProperty(node) {
  var name = toPropertyName(node.key, node.computed);
  if (node.shorthand) {
    return new Shift.ShorthandProperty({ name: node.key.name });
  }
  return new Shift.DataProperty({ name: name, expression: toExpression(node.value) });
}

function toMethod(node) {
  return new Shift.Method({
    isGenerator: node.generator,
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body),
    params: new Shift.FormalParameters(convertFunctionParams(node))
  });
}

function toGetter(node) {
  return new Shift.Getter({
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body)
  });
}

function toSetter(node) {
  var params = convertFunctionParams(node);
  return new Shift.Setter({
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body),
    param: params.items[0] || params.rest
  });
}

function convertObjectMethod(node) {
  switch (node.kind) {
    case "method":
      return toMethod(node);
    case "get":
      return toGetter(node);
    case "set":
      return toSetter(node);
    default:
      throw Error("Unknown kind of method: " + node.kind);
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement({ expression: toExpression(node.argument) });
}

function convertSequenceExpression(node) {
  var expr = toExpression(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new Shift.BinaryExpression({
      operator: ",",
      left: expr,
      right: toExpression(node.expressions[i])
    });
  }
  return expr;
}

function convertSwitchCase(node) {
  if (node.test) {
    return new Shift.SwitchCase({
      test: convert(node.test),
      consequent: node.consequent.map(convert)
    });
  }
  return new Shift.SwitchDefault({ consequent: node.consequent.map(convert) });
}

function convertSwitchStatement(node) {
  if (!node.cases.every(function (c) {
    return c.test != null;
  })) {
    var scs = node.cases.map(convertSwitchCase);
    for (var i = 0; i < scs.length; i++) {
      if (scs[i].type === "SwitchDefault") {
        break;
      }
    }
    return new Shift.SwitchStatementWithDefault({
      discriminant: toExpression(node.discriminant),
      preDefaultCases: scs.slice(0, i),
      defaultCase: scs[i],
      postDefaultCases: scs.slice(i + 1)
    });
  } else {
    return new Shift.SwitchStatement({
      discriminant: toExpression(node.discriminant),
      cases: node.cases.map(convertSwitchCase)
    });
  }
}

function convertThisExpression() {
  return new Shift.ThisExpression();
}

function convertThrowStatement(node) {
  return new Shift.ThrowStatement({ expression: toExpression(node.argument) });
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new Shift.TryFinallyStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      finalizer: convertBlock(node.finalizer)
    });
  } else {
    return new Shift.TryCatchStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      handlers: [convert(node.handler)]
    });
  }
}

function convertUpdateExpression(node) {
  return new Shift.UpdateExpression({
    isPrefix: node.prefix,
    operator: node.operator,
    operand: toBinding(node.argument)
  });
}

function convertUnaryExpression(node) {
  return new Shift.UnaryExpression({
    operator: node.operator,
    operand: toExpression(node.argument)
  });
}

function convertVariableDeclaration(node, isDeclaration) {
  var declaration = new Shift.VariableDeclaration({
    kind: node.kind,
    declarators: node.declarations.map(convertVariableDeclarator)
  });
  if (isDeclaration) return declaration;
  return new Shift.VariableDeclarationStatement({ declaration: declaration });
}

function convertVariableDeclarator(node) {
  return new Shift.VariableDeclarator({
    binding: toBinding(node.id),
    init: convert(node.init)
  });
}

function convertWhileStatement(node) {
  return new Shift.WhileStatement({ test: convert(node.test), body: convert(node.body) });
}

function convertWithStatement(node) {
  return new Shift.WithStatement({ object: convert(node.object), body: convert(node.body) });
}

function convertMetaProperty(node) {
  if (node.meta === "new" && node.property === "target") {
    return new Shift.NewTargetExpression();
  }
  return null;
}

function convertObjectPattern(node) {
  return new Shift.ObjectBinding({ properties: node.properties.map(toBinding) });
}

function convertAssignmentPattern(node) {
  return new Shift.BindingWithDefault({
    binding: toBinding(node.left),
    init: convert(node.right)
  });
}

function convertClassDeclaration(node) {
  return new Shift.ClassDeclaration({
    name: toBinding(node.id),
    super: toExpression(node.superClass),
    elements: convert(node.body)
  });
}

function convertClassExpression(node) {
  var _convertClassDeclarat = convertClassDeclaration(node);

  var name = _convertClassDeclarat.name;
  var spr = _convertClassDeclarat.super;
  var elements = _convertClassDeclarat.elements;

  return new Shift.ClassExpression({ name: name, super: spr, elements: elements });
}

function convertClassBody(node) {
  return node.body.map(convert);
}

function convertRestElement(node) {
  return toBinding(node.argument);
}

function convertElements(elts) {
  var count = elts.length;
  if (count === 0) {
    return [[], null];
  } else if (elts[count - 1].type === "RestElement") {
    return [elts.slice(0, count - 1).map(toBinding), toBinding(elts[count - 1])];
  } else {
    return [elts.map(toBinding), null];
  }
}

function convertArrayPattern(node) {
  var _convertElements = convertElements(node.elements);

  var _convertElements2 = _slicedToArray(_convertElements, 2);

  var elements = _convertElements2[0];
  var restElement = _convertElements2[1];

  return new Shift.ArrayBinding({ elements: elements, restElement: restElement });
}

function convertArrowFunctionExpression(node) {
  return new Shift.ArrowExpression({
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: node.expression ? convert(node.body) : toFunctionBody(node.body)
  });
}

function convertFunctionParams(node) {
  var _convertElements3 = convertElements(node.params);

  var _convertElements4 = _slicedToArray(_convertElements3, 2);

  var items = _convertElements4[0];
  var rest = _convertElements4[1];

  return { items: items, rest: rest };
}

function convertClassMethod(node) {
  return new Shift.ClassElement({ isStatic: node.static, method: toMethod(node) });
}

function convertSuper(node) {
  return new Shift.Super();
}

function convertTaggedTemplateExpression(node) {
  var elts = [];
  node.quasi.quasis.forEach(function (e, i) {
    elts.push(convertTemplateElement(e));
    if (i < node.quasi.expressions.length) elts.push(toExpression(node.quasi.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: toExpression(node.tag),
    elements: elts
  });
}

function convertTemplateElement(node) {
  return new Shift.TemplateElement({ rawValue: node.value.raw });
}

function convertTemplateLiteral(node, tag) {
  var elts = [];
  node.quasis.forEach(function (e, i) {
    elts.push(convertTemplateElement(e));
    if (i < node.expressions.length) elts.push(toExpression(node.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: tag != null ? convert(tag) : null,
    elements: elts
  });
}

function convertYieldExpression(node) {
  if (node.delegate) return new Shift.YieldGeneratorExpression({ expression: toExpression(node.argument) });
  return new Shift.YieldExpression({ expression: toExpression(node.argument) });
}

function convertExportAllDeclaration(node) {
  return new Shift.ExportAllFrom({ moduleSpecifier: node.source.value });
}

function convertExportNamedDeclaration(node) {
  if (node.declaration != null) {
    return new Shift.Export({
      kind: node.kind,
      declaration: node.declaration.type === "VariableDeclaration" ? convertVariableDeclaration(node.declaration, true) : convert(node.declaration)
    });
  }

  return new Shift.ExportFrom({
    moduleSpecifier: node.source != null ? node.source.value : null,
    namedExports: node.specifiers.map(convert)
  });
}

function convertExportSpecifier(node) {
  return new Shift.ExportSpecifier({
    exportedName: node.exported.name,
    name: node.local.name !== node.exported.name ? node.local.name : null
  });
}

function convertExportDefaultDeclaration(node) {
  return new Shift.ExportDefault({ body: convert(node.declaration) });
}

function toImportNamespace(node, hasDefaultSpecifier) {
  var firstBinding = toBinding(node.specifiers[0]);
  return new Shift.ImportNamespace({
    moduleSpecifier: node.source.value,
    namespaceBinding: hasDefaultSpecifier ? toBinding(node.specifiers[1]) : firstBinding,
    defaultBinding: hasDefaultSpecifier ? firstBinding : null
  });
}

function convertImportDeclaration(node) {
  var hasDefaultSpecifier = node.specifiers.some(function (s) {
    return s.type === "ImportDefaultSpecifier";
  });
  if (node.specifiers.some(function (s) {
    return s.type === "ImportNamespaceSpecifier";
  })) return toImportNamespace(node, hasDefaultSpecifier);

  var namedImports = node.specifiers.map(convert);
  if (hasDefaultSpecifier) namedImports.shift();
  return new Shift.Import({
    moduleSpecifier: node.source.value,
    namedImports: namedImports,
    defaultBinding: hasDefaultSpecifier ? toBinding(node.specifiers[0]) : null
  });
}

function convertImportDefaultSpecifier(node) {
  return toBinding(node.local);
}

function convertImportNamespaceSpecifier(node) {
  return toBinding(node.local);
}

function convertImportSpecifier(node) {
  return new Shift.ImportSpecifier({
    name: node.imported.name === node.local.name ? null : node.imported.name,
    binding: toBinding(node.local)
  });
}

function convertSpreadElement(node) {
  return new Shift.SpreadElement({ expression: toExpression(node.argument) });
}

function convertFile(node) {
  return convert(node.program);
}

var Convert = {
  AssignmentExpression: convertAssignmentExpression,
  AssignmentPattern: convertAssignmentPattern,
  ArrayExpression: convertArrayExpression,
  ArrayPattern: convertArrayPattern,
  ArrowFunctionExpression: convertArrowFunctionExpression,
  BlockStatement: convertBlockStatement,
  BinaryExpression: convertBinaryExpression,
  BreakStatement: convertBreakStatement,
  CallExpression: convertCallExpression,
  CatchClause: convertCatchClause,
  ClassDeclaration: convertClassDeclaration,
  ClassExpression: convertClassExpression,
  ClassBody: convertClassBody,
  ClassMethod: convertClassMethod,
  ConditionalExpression: convertConditionalExpression,
  ContinueStatement: convertContinueStatement,
  DoWhileStatement: convertDoWhileStatement,
  DebuggerStatement: convertDebuggerStatement,
  EmptyStatement: convertEmptyStatement,
  ExportAllDeclaration: convertExportAllDeclaration,
  ExportDefaultDeclaration: convertExportDefaultDeclaration,
  ExportNamedDeclaration: convertExportNamedDeclaration,
  ExportSpecifier: convertExportSpecifier,
  ExpressionStatement: convertExpressionStatement,
  File: convertFile,
  ForStatement: convertForStatement,
  ForOfStatement: convertForOfStatement,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  IfStatement: convertIfStatement,
  ImportDeclaration: convertImportDeclaration,
  ImportDefaultSpecifier: convertImportDefaultSpecifier,
  ImportNamespaceSpecifier: convertImportNamespaceSpecifier,
  ImportSpecifier: convertImportSpecifier,
  Literal: convertLiteral,
  BooleanLiteral: convertBooleanLiteral,
  NumericLiteral: convertNumericLiteral,
  StringLiteral: convertStringLiteral,
  RegExpLiteral: convertRegExpLiteral,
  NullLiteral: convertNullLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  MetaProperty: convertMetaProperty,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  ObjectPattern: convertObjectPattern,
  ObjectProperty: convertObjectProperty,
  Program: convertProgram,
  RestElement: convertRestElement,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SpreadElement: convertSpreadElement,
  Super: convertSuper,
  SwitchCase: convertSwitchCase,
  SwitchStatement: convertSwitchStatement,
  TaggedTemplateExpression: convertTaggedTemplateExpression,
  TemplateElement: convertTemplateElement,
  TemplateLiteral: convertTemplateLiteral,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,
  YieldExpression: convertYieldExpression
};
//# sourceMappingURL=data:application/json;base64,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QWMsbUJBN0NBO0FBOENkLGlCQUFlLG9CQTlDRDtBQStDZCxvQkFBa0IsdUJBL0NKO0FBZ0RkLGlCQUFlLG9CQWhERDtBQWlEZCxrQkFBZ0IscUJBakRGO0FBa0RkLFdBQVMsY0FsREs7QUFtRGQsZUFBYSxrQkFuREM7QUFvRGQsbUJBQWlCLHNCQXBESDtBQXFEZCxzQkFBb0IseUJBckROO0FBc0RkLGlCQUFlLG9CQXRERDtBQXVEZCxTQUFPLFlBdkRPO0FBd0RkLGNBQVksaUJBeERFO0FBeURkLG1CQUFpQixzQkF6REg7QUEwRGQsNEJBQTBCLCtCQTFEWjtBQTJEZCxtQkFBaUIsc0JBM0RIO0FBNERkLG1CQUFpQixzQkE1REg7QUE2RGQsa0JBQWdCLHFCQTdERjtBQThEZCxrQkFBZ0IscUJBOURGO0FBK0RkLGdCQUFjLG1CQS9EQTtBQWdFZCxtQkFBaUIsc0JBaEVIO0FBaUVkLG9CQUFrQix1QkFqRUo7QUFrRWQsdUJBQXFCLDBCQWxFUDtBQW1FZCxzQkFBb0IseUJBbkVOO0FBb0VkLGtCQUFnQixxQkFwRUY7QUFxRWQsaUJBQWUsb0JBckVEO0FBc0VkLG1CQUFpQjtBQXRFSCxDQUFoQiIsImZpbGUiOiJ0by1zaGlmdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBTaGlmdCBmcm9tIFwic2hpZnQtYXN0XCI7XG5cbi8vIGNvbnZlcnQgQmFieWxvbiBBU1QgZm9ybWF0IHRvIFNoaWZ0IEFTVCBmb3JtYXRcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydChub2RlKSB7XG4gIGlmIChub2RlID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmKCFDb252ZXJ0W25vZGUudHlwZV0pIHRocm93IEVycm9yKGBVbnJlY29nbml6ZWQgdHlwZTogJHtub2RlLnR5cGV9YCk7XG5cbiAgcmV0dXJuIENvbnZlcnRbbm9kZS50eXBlXShub2RlKTtcbn1cblxuZnVuY3Rpb24gdG9CaW5kaW5nKG5vZGUpIHtcbiAgaWYobm9kZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgc3dpdGNoKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJJZGVudGlmaWVyXCI6IHJldHVybiBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIoeyBuYW1lOiBub2RlLm5hbWUgfSk7XG4gICAgY2FzZSBcIk9iamVjdFByb3BlcnR5XCI6IGlmKG5vZGUuc2hvcnRoYW5kKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoe1xuICAgICAgICBiaW5kaW5nOiB0b0JpbmRpbmcobm9kZS5rZXkpLFxuICAgICAgICBpbml0OiB0b0V4cHJlc3Npb24obm9kZS52YWx1ZS5yaWdodClcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KHtcbiAgICAgICAgbmFtZTogdG9Qcm9wZXJ0eU5hbWUobm9kZS5rZXksIG5vZGUuY29tcHV0ZWQpLFxuICAgICAgICBiaW5kaW5nOiB0b0JpbmRpbmcobm9kZS52YWx1ZSlcbiAgICAgIH0pO1xuICAgIH1cbiAgICBkZWZhdWx0OiByZXR1cm4gY29udmVydChub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXNzaWdubWVudEV4cHJlc3Npb24obm9kZSkge1xuICBsZXQgYmluZGluZyA9IHRvQmluZGluZyhub2RlLmxlZnQpLFxuICAgICAgZXhwcmVzc2lvbiA9IHRvRXhwcmVzc2lvbihub2RlLnJpZ2h0KSxcbiAgICAgIG9wZXJhdG9yID0gbm9kZS5vcGVyYXRvcjtcbiAgaWYob3BlcmF0b3IgPT09IFwiPVwiKSByZXR1cm4gbmV3IFNoaWZ0LkFzc2lnbm1lbnRFeHByZXNzaW9uKHsgYmluZGluZywgZXhwcmVzc2lvbiB9KTtcbiAgZWxzZSByZXR1cm4gbmV3IFNoaWZ0LkNvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb24oeyBiaW5kaW5nLCBleHByZXNzaW9uLCBvcGVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFycmF5RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQXJyYXlFeHByZXNzaW9uKHsgZWxlbWVudHM6IG5vZGUuZWxlbWVudHMubWFwKGNvbnZlcnQpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmluYXJ5RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbih7XG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgbGVmdDogY29udmVydChub2RlLmxlZnQpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUucmlnaHQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmxvY2sobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkJsb2NrKHsgc3RhdGVtZW50czogbm9kZS5ib2R5Lm1hcChjb252ZXJ0KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJsb2NrU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5CbG9ja1N0YXRlbWVudCh7IGJsb2NrOiBjb252ZXJ0QmxvY2sobm9kZSkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCcmVha1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQoeyBsYWJlbDogbm9kZS5sYWJlbCA/IG5vZGUubGFiZWwubmFtZSA6IG51bGwgfSk7XG59XG5cbmZ1bmN0aW9uIHRvRXhwcmVzc2lvbihub2RlKSB7XG4gIGlmKG5vZGUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIHN3aXRjaChub2RlLnR5cGUpIHtcbiAgICBjYXNlIFwiTGl0ZXJhbFwiOiByZXR1cm4gY29udmVydExpdGVyYWwobm9kZSk7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjogcmV0dXJuIG5ldyBTaGlmdC5JZGVudGlmaWVyRXhwcmVzc2lvbih7IG5hbWU6IG5vZGUubmFtZSB9KTtcbiAgICBjYXNlIFwiTWV0YVByb3BlcnR5XCI6IHJldHVybiBuZXcgU2hpZnQuTmV3VGFyZ2V0RXhwcmVzc2lvbigpO1xuICAgIGNhc2UgXCJUZW1wbGF0ZUxpdGVyYWxcIjogcmV0dXJuIGNvbnZlcnRUZW1wbGF0ZUxpdGVyYWwobm9kZSk7XG4gICAgY2FzZSBcIk9iamVjdE1ldGhvZFwiOiByZXR1cm4gY29udmVydE9iamVjdE1ldGhvZChub2RlKTtcbiAgICBkZWZhdWx0OiByZXR1cm4gY29udmVydChub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b0FyZ3VtZW50KG5vZGUpIHtcbiAgaWYobm9kZS50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgIHJldHVybiBjb252ZXJ0U3ByZWFkRWxlbWVudChub2RlKTtcbiAgfVxuICByZXR1cm4gdG9FeHByZXNzaW9uKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2FsbEV4cHJlc3Npb24obm9kZSkge1xuICBsZXQgY2FsbGVlID0gbm9kZS5jYWxsZWUudHlwZSA9PT0gXCJTdXBlclwiID9cbiAgICAgIGNvbnZlcnRTdXBlcihub2RlLmNhbGxlZSkgOlxuICAgICAgdG9FeHByZXNzaW9uKG5vZGUuY2FsbGVlKTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5DYWxsRXhwcmVzc2lvbih7IGNhbGxlZSwgYXJndW1lbnRzOiBub2RlLmFyZ3VtZW50cy5tYXAodG9Bcmd1bWVudCkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDYXRjaENsYXVzZShub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQ2F0Y2hDbGF1c2Uoe1xuICAgIGJpbmRpbmc6IHRvQmluZGluZyhub2RlLnBhcmFtKSxcbiAgICBib2R5OiBjb252ZXJ0QmxvY2sobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKHtcbiAgICB0ZXN0OiB0b0V4cHJlc3Npb24obm9kZS50ZXN0KSxcbiAgICBjb25zZXF1ZW50OiB0b0V4cHJlc3Npb24obm9kZS5jb25zZXF1ZW50KSxcbiAgICBhbHRlcm5hdGU6IHRvRXhwcmVzc2lvbihub2RlLmFsdGVybmF0ZSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb250aW51ZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQoeyBsYWJlbDogbm9kZS5sYWJlbCA/IG5vZGUubGFiZWwubmFtZSA6IG51bGwgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREZWJ1Z2dlclN0YXRlbWVudCgpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5EZWJ1Z2dlclN0YXRlbWVudCgpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RG9XaGlsZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudCh7XG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEVtcHR5U3RhdGVtZW50KCkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkVtcHR5U3RhdGVtZW50KCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KHsgZXhwcmVzc2lvbjogdG9FeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbikgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JTdGF0ZW1lbnQobm9kZSkge1xuICBsZXQgaW5pdCA9IChub2RlLmluaXQgIT0gbnVsbCAmJiBub2RlLmluaXQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIpID9cbiAgICAgIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUuaW5pdCwgdHJ1ZSkgOlxuICAgICAgdG9FeHByZXNzaW9uKG5vZGUuaW5pdCk7XG4gIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KHtcbiAgICBpbml0LFxuICAgIHRlc3Q6IHRvRXhwcmVzc2lvbihub2RlLnRlc3QpLFxuICAgIHVwZGF0ZTogdG9FeHByZXNzaW9uKG5vZGUudXBkYXRlKSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JJblN0YXRlbWVudChub2RlKSB7XG4gIGxldCBsZWZ0ID0gbm9kZS5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiID9cbiAgICAgIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUubGVmdCwgdHJ1ZSkgOlxuICAgICAgdG9CaW5kaW5nKG5vZGUubGVmdCk7XG4gIHJldHVybiBuZXcgU2hpZnQuRm9ySW5TdGF0ZW1lbnQoe1xuICAgIGxlZnQsXG4gICAgcmlnaHQ6IHRvRXhwcmVzc2lvbihub2RlLnJpZ2h0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JPZlN0YXRlbWVudChub2RlKSB7XG4gIGxldCBsZWZ0ID0gbm9kZS5sZWZ0LnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiID9cbiAgICAgIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUubGVmdCwgdHJ1ZSkgOlxuICAgICAgdG9CaW5kaW5nKG5vZGUubGVmdCk7XG4gIHJldHVybiBuZXcgU2hpZnQuRm9yT2ZTdGF0ZW1lbnQoe1xuICAgIGxlZnQsXG4gICAgcmlnaHQ6IHRvRXhwcmVzc2lvbihub2RlLnJpZ2h0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvRnVuY3Rpb25Cb2R5KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5GdW5jdGlvbkJvZHkoe1xuICAgIGRpcmVjdGl2ZXM6IG5vZGUuZGlyZWN0aXZlcy5tYXAoY29udmVydERpcmVjdGl2ZSksXG4gICAgc3RhdGVtZW50czogbm9kZS5ib2R5Lm1hcChjb252ZXJ0KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkZ1bmN0aW9uRGVjbGFyYXRpb24oe1xuICAgIGlzR2VuZXJhdG9yOiBub2RlLmdlbmVyYXRvcixcbiAgICBuYW1lOiB0b0JpbmRpbmcobm9kZS5pZCksXG4gICAgcGFyYW1zOiBuZXcgU2hpZnQuRm9ybWFsUGFyYW1ldGVycyhjb252ZXJ0RnVuY3Rpb25QYXJhbXMobm9kZSkpLFxuICAgIGJvZHk6IHRvRnVuY3Rpb25Cb2R5KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGdW5jdGlvbkV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkZ1bmN0aW9uRXhwcmVzc2lvbih7XG4gICAgaXNHZW5lcmF0b3I6IG5vZGUuZ2VuZXJhdG9yLFxuICAgIG5hbWU6IHRvQmluZGluZyhub2RlLmlkKSxcbiAgICBwYXJhbXM6IG5ldyBTaGlmdC5Gb3JtYWxQYXJhbWV0ZXJzKGNvbnZlcnRGdW5jdGlvblBhcmFtcyhub2RlKSksXG4gICAgYm9keTogdG9GdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydElmU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5JZlN0YXRlbWVudCh7XG4gICAgdGVzdDogdG9FeHByZXNzaW9uKG5vZGUudGVzdCksXG4gICAgY29uc2VxdWVudDogY29udmVydChub2RlLmNvbnNlcXVlbnQpLFxuICAgIGFsdGVybmF0ZTogY29udmVydChub2RlLmFsdGVybmF0ZSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMYWJlbGVkU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5MYWJlbGVkU3RhdGVtZW50KHtcbiAgICBsYWJlbDogbm9kZS5sYWJlbC5uYW1lLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWwobm9kZSkge1xuICBzd2l0Y2ggKHR5cGVvZiBub2RlLnZhbHVlKSB7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgaWYgKG5vZGUudmFsdWUgPT09IDEgLyAwKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSk7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsU3RyaW5nRXhwcmVzc2lvbihub2RlKTtcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24obm9kZSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChub2RlLnZhbHVlID09PSBudWxsKVxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxOdWxsRXhwcmVzc2lvbigpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUucmVnZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCb29sZWFuTGl0ZXJhbChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TnVtZXJpY0xpdGVyYWwobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvbihub2RlKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN0cmluZ0xpdGVyYWwobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UmVnRXhwTGl0ZXJhbChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24obm9kZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROdWxsTGl0ZXJhbChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uKCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRNZW1iZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IG9iaiA9IG5vZGUub2JqZWN0LnR5cGUgPT09IFwiU3VwZXJcIiA/XG4gICAgICBjb252ZXJ0U3VwZXIobm9kZS5vYmplY3QpIDpcbiAgICAgIHRvRXhwcmVzc2lvbihub2RlLm9iamVjdCk7XG5cbiAgaWYgKG5vZGUuY29tcHV0ZWQpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbih7XG4gICAgICBvYmplY3Q6IG9iaixcbiAgICAgIGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLnByb3BlcnR5KVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbih7XG4gICAgICBvYmplY3Q6IG9iaixcbiAgICAgIHByb3BlcnR5OiBub2RlLnByb3BlcnR5Lm5hbWVcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0TmV3RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbih7XG4gICAgY2FsbGVlOiB0b0FyZ3VtZW50KG5vZGUuY2FsbGVlKSxcbiAgICBhcmd1bWVudHM6IG5vZGUuYXJndW1lbnRzLm1hcCh0b0FyZ3VtZW50KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0Lk9iamVjdEV4cHJlc3Npb24oeyBwcm9wZXJ0aWVzOiBub2RlLnByb3BlcnRpZXMubWFwKHRvRXhwcmVzc2lvbikgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREaXJlY3RpdmUobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkRpcmVjdGl2ZSh7cmF3VmFsdWU6IG5vZGUudmFsdWUudmFsdWV9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFByb2dyYW0obm9kZSkge1xuICBsZXQgZGlyZWN0aXZlcyA9IG5vZGUuZGlyZWN0aXZlcyA/IG5vZGUuZGlyZWN0aXZlcy5tYXAoY29udmVydERpcmVjdGl2ZSkgOiBbXSxcbiAgICAgIHN0YXRlbWVudHMgPSBub2RlLmJvZHkubWFwKGNvbnZlcnQpO1xuXG4gIGlmKG5vZGUuc291cmNlVHlwZSA9PT0gXCJtb2R1bGVcIikge1xuICAgIHJldHVybiBuZXcgU2hpZnQuTW9kdWxlKHsgZGlyZWN0aXZlcywgaXRlbXM6IHN0YXRlbWVudHMgfSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBTaGlmdC5TY3JpcHQoeyBkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzIH0pO1xufVxuXG5mdW5jdGlvbiB0b1Byb3BlcnR5TmFtZShub2RlLCBjb21wdXRlZCkge1xuICBpZihjb21wdXRlZCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuQ29tcHV0ZWRQcm9wZXJ0eU5hbWUoeyBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZSl9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh7XG4gICAgICB2YWx1ZTogKG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyXCIpID8gbm9kZS5uYW1lIDogbm9kZS52YWx1ZS50b1N0cmluZygpXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdFByb3BlcnR5KG5vZGUpIHtcbiAgbGV0IG5hbWUgPSB0b1Byb3BlcnR5TmFtZShub2RlLmtleSwgbm9kZS5jb21wdXRlZCk7XG4gIGlmKG5vZGUuc2hvcnRoYW5kKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eSh7IG5hbWU6IG5vZGUua2V5Lm5hbWUgfSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoeyBuYW1lLCBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZS52YWx1ZSl9KTtcbn1cblxuZnVuY3Rpb24gdG9NZXRob2Qobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0Lk1ldGhvZCh7XG4gICAgaXNHZW5lcmF0b3I6IG5vZGUuZ2VuZXJhdG9yLFxuICAgIG5hbWU6IHRvUHJvcGVydHlOYW1lKG5vZGUua2V5LCBub2RlLmNvbXB1dGVkKSxcbiAgICBib2R5OiB0b0Z1bmN0aW9uQm9keShub2RlLmJvZHkpLFxuICAgIHBhcmFtczogbmV3IFNoaWZ0LkZvcm1hbFBhcmFtZXRlcnMoY29udmVydEZ1bmN0aW9uUGFyYW1zKG5vZGUpKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9HZXR0ZXIobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkdldHRlcih7XG4gICAgbmFtZTogdG9Qcm9wZXJ0eU5hbWUobm9kZS5rZXksIG5vZGUuY29tcHV0ZWQpLFxuICAgIGJvZHk6IHRvRnVuY3Rpb25Cb2R5KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvU2V0dGVyKG5vZGUpIHtcbiAgbGV0IHBhcmFtcyA9IGNvbnZlcnRGdW5jdGlvblBhcmFtcyhub2RlKTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5TZXR0ZXIoe1xuICAgIG5hbWU6IHRvUHJvcGVydHlOYW1lKG5vZGUua2V5LCBub2RlLmNvbXB1dGVkKSxcbiAgICBib2R5OiB0b0Z1bmN0aW9uQm9keShub2RlLmJvZHkpLFxuICAgIHBhcmFtOiBwYXJhbXMuaXRlbXNbMF0gfHwgcGFyYW1zLnJlc3RcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRPYmplY3RNZXRob2Qobm9kZSkge1xuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgXCJtZXRob2RcIjogcmV0dXJuIHRvTWV0aG9kKG5vZGUpO1xuICAgIGNhc2UgXCJnZXRcIjogcmV0dXJuIHRvR2V0dGVyKG5vZGUpO1xuICAgIGNhc2UgXCJzZXRcIjogcmV0dXJuIHRvU2V0dGVyKG5vZGUpO1xuICAgIGRlZmF1bHQ6IHRocm93IEVycm9yKGBVbmtub3duIGtpbmQgb2YgbWV0aG9kOiAke25vZGUua2luZH1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0UmV0dXJuU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQoeyBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZS5hcmd1bWVudCkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTZXF1ZW5jZUV4cHJlc3Npb24obm9kZSkge1xuICB2YXIgZXhwciA9IHRvRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb25zWzBdKTtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBub2RlLmV4cHJlc3Npb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgZXhwciA9IG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHtcbiAgICAgIG9wZXJhdG9yOiBcIixcIixcbiAgICAgIGxlZnQ6IGV4cHIsXG4gICAgICByaWdodDogdG9FeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbnNbaV0pXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGV4cHI7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTd2l0Y2hDYXNlKG5vZGUpIHtcbiAgaWYgKG5vZGUudGVzdCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoQ2FzZSh7XG4gICAgICB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksXG4gICAgICBjb25zZXF1ZW50OiBub2RlLmNvbnNlcXVlbnQubWFwKGNvbnZlcnQpXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHsgY29uc2VxdWVudDogbm9kZS5jb25zZXF1ZW50Lm1hcChjb252ZXJ0KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN3aXRjaFN0YXRlbWVudChub2RlKSB7XG4gIGlmICghbm9kZS5jYXNlcy5ldmVyeSgoYykgPT4gYy50ZXN0ICE9IG51bGwgKSkge1xuICAgIHZhciBzY3MgPSBub2RlLmNhc2VzLm1hcChjb252ZXJ0U3dpdGNoQ2FzZSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChzY3NbaV0udHlwZSA9PT0gXCJTd2l0Y2hEZWZhdWx0XCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQoe1xuICAgICAgZGlzY3JpbWluYW50OiB0b0V4cHJlc3Npb24obm9kZS5kaXNjcmltaW5hbnQpLFxuICAgICAgcHJlRGVmYXVsdENhc2VzOiBzY3Muc2xpY2UoMCwgaSksXG4gICAgICBkZWZhdWx0Q2FzZTogc2NzW2ldLFxuICAgICAgcG9zdERlZmF1bHRDYXNlczogc2NzLnNsaWNlKGkgKyAxKVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KHtcbiAgICAgIGRpc2NyaW1pbmFudDogdG9FeHByZXNzaW9uKG5vZGUuZGlzY3JpbWluYW50KSxcbiAgICAgIGNhc2VzOiBub2RlLmNhc2VzLm1hcChjb252ZXJ0U3dpdGNoQ2FzZSlcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGhpc0V4cHJlc3Npb24oKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuVGhpc0V4cHJlc3Npb24oKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRocm93U3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5UaHJvd1N0YXRlbWVudCh7IGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLmFyZ3VtZW50KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRyeVN0YXRlbWVudChub2RlKSB7XG4gIGlmIChub2RlLmZpbmFsaXplciAhPSBudWxsKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KHtcbiAgICAgIGJvZHk6IGNvbnZlcnRCbG9jayhub2RlLmJsb2NrKSxcbiAgICAgIGNhdGNoQ2xhdXNlOiBjb252ZXJ0Q2F0Y2hDbGF1c2Uobm9kZS5oYW5kbGVyKSxcbiAgICAgIGZpbmFsaXplcjogY29udmVydEJsb2NrKG5vZGUuZmluYWxpemVyKVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5Q2F0Y2hTdGF0ZW1lbnQoe1xuICAgICAgYm9keTogY29udmVydEJsb2NrKG5vZGUuYmxvY2spLFxuICAgICAgY2F0Y2hDbGF1c2U6IGNvbnZlcnRDYXRjaENsYXVzZShub2RlLmhhbmRsZXIpLFxuICAgICAgaGFuZGxlcnM6IFtjb252ZXJ0KG5vZGUuaGFuZGxlcildXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydFVwZGF0ZUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlVwZGF0ZUV4cHJlc3Npb24oe1xuICAgIGlzUHJlZml4OiBub2RlLnByZWZpeCxcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBvcGVyYW5kOiB0b0JpbmRpbmcobm9kZS5hcmd1bWVudClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRVbmFyeUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlVuYXJ5RXhwcmVzc2lvbih7XG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgb3BlcmFuZDogdG9FeHByZXNzaW9uKG5vZGUuYXJndW1lbnQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvbihub2RlLCBpc0RlY2xhcmF0aW9uKSB7XG4gIGxldCBkZWNsYXJhdGlvbiA9IG5ldyBTaGlmdC5WYXJpYWJsZURlY2xhcmF0aW9uKHtcbiAgICBraW5kOiBub2RlLmtpbmQsXG4gICAgZGVjbGFyYXRvcnM6IG5vZGUuZGVjbGFyYXRpb25zLm1hcChjb252ZXJ0VmFyaWFibGVEZWNsYXJhdG9yKVxuICB9KTtcbiAgaWYoaXNEZWNsYXJhdGlvbikgcmV0dXJuIGRlY2xhcmF0aW9uO1xuICByZXR1cm4gbmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoeyBkZWNsYXJhdGlvbiB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFZhcmlhYmxlRGVjbGFyYXRvcihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdG9yKHtcbiAgICBiaW5kaW5nOiB0b0JpbmRpbmcobm9kZS5pZCksXG4gICAgaW5pdDogY29udmVydChub2RlLmluaXQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0V2hpbGVTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LldoaWxlU3RhdGVtZW50KHsgdGVzdDogY29udmVydChub2RlLnRlc3QpLCBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRXaXRoU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5XaXRoU3RhdGVtZW50KHsgb2JqZWN0OiBjb252ZXJ0KG5vZGUub2JqZWN0KSwgYm9keTogY29udmVydChub2RlLmJvZHkpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TWV0YVByb3BlcnR5KG5vZGUpIHtcbiAgaWYobm9kZS5tZXRhID09PSBcIm5ld1wiICYmIG5vZGUucHJvcGVydHkgPT09IFwidGFyZ2V0XCIpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0Lk5ld1RhcmdldEV4cHJlc3Npb24oKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdFBhdHRlcm4obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0Lk9iamVjdEJpbmRpbmcoeyBwcm9wZXJ0aWVzOiBub2RlLnByb3BlcnRpZXMubWFwKHRvQmluZGluZyl9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFzc2lnbm1lbnRQYXR0ZXJuKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nV2l0aERlZmF1bHQoe1xuICAgIGJpbmRpbmc6IHRvQmluZGluZyhub2RlLmxlZnQpLFxuICAgIGluaXQ6IGNvbnZlcnQobm9kZS5yaWdodClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKHtcbiAgICBuYW1lOiB0b0JpbmRpbmcobm9kZS5pZCksXG4gICAgc3VwZXI6IHRvRXhwcmVzc2lvbihub2RlLnN1cGVyQ2xhc3MpLFxuICAgIGVsZW1lbnRzOiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc0V4cHJlc3Npb24obm9kZSkge1xuICBsZXQge25hbWUsc3VwZXI6c3ByLGVsZW1lbnRzfSA9IGNvbnZlcnRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICByZXR1cm4gbmV3IFNoaWZ0LkNsYXNzRXhwcmVzc2lvbih7IG5hbWUsIHN1cGVyOnNwciwgZWxlbWVudHMgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc0JvZHkobm9kZSkge1xuICByZXR1cm4gbm9kZS5ib2R5Lm1hcChjb252ZXJ0KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFJlc3RFbGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHRvQmluZGluZyhub2RlLmFyZ3VtZW50KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEVsZW1lbnRzKGVsdHMpIHtcbiAgbGV0IGNvdW50ID0gZWx0cy5sZW5ndGg7XG4gIGlmKGNvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIFtbXSwgbnVsbF07XG4gIH0gZWxzZSBpZihlbHRzW2NvdW50LTFdLnR5cGUgPT09IFwiUmVzdEVsZW1lbnRcIikge1xuICAgIHJldHVybiBbZWx0cy5zbGljZSgwLGNvdW50LTEpLm1hcCh0b0JpbmRpbmcpLCB0b0JpbmRpbmcoZWx0c1tjb3VudC0xXSldO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBbZWx0cy5tYXAodG9CaW5kaW5nKSwgbnVsbF07XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydEFycmF5UGF0dGVybihub2RlKSB7XG4gIGxldCBbZWxlbWVudHMsIHJlc3RFbGVtZW50XSA9IGNvbnZlcnRFbGVtZW50cyhub2RlLmVsZW1lbnRzKTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoeyBlbGVtZW50cywgcmVzdEVsZW1lbnQgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQXJyb3dFeHByZXNzaW9uKHtcbiAgICBwYXJhbXM6IG5ldyBTaGlmdC5Gb3JtYWxQYXJhbWV0ZXJzKGNvbnZlcnRGdW5jdGlvblBhcmFtcyhub2RlKSksXG4gICAgYm9keTogbm9kZS5leHByZXNzaW9uID8gY29udmVydChub2RlLmJvZHkpIDogdG9GdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uUGFyYW1zKG5vZGUpIHtcbiAgbGV0IFtpdGVtcywgcmVzdF0gPSBjb252ZXJ0RWxlbWVudHMobm9kZS5wYXJhbXMpO1xuICByZXR1cm4geyBpdGVtcywgcmVzdCB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2xhc3NNZXRob2Qobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkNsYXNzRWxlbWVudCh7IGlzU3RhdGljOiBub2RlLnN0YXRpYywgbWV0aG9kOiB0b01ldGhvZChub2RlKSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN1cGVyKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5TdXBlcigpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IGVsdHMgPSBbXTtcbiAgbm9kZS5xdWFzaS5xdWFzaXMuZm9yRWFjaCgoZSxpKSA9PiB7XG4gICAgZWx0cy5wdXNoKGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQoZSkpO1xuICAgIGlmKGkgPCBub2RlLnF1YXNpLmV4cHJlc3Npb25zLmxlbmd0aCkgZWx0cy5wdXNoKHRvRXhwcmVzc2lvbihub2RlLnF1YXNpLmV4cHJlc3Npb25zW2ldKSk7XG4gIH0pO1xuICByZXR1cm4gbmV3IFNoaWZ0LlRlbXBsYXRlRXhwcmVzc2lvbih7XG4gICAgdGFnOiB0b0V4cHJlc3Npb24obm9kZS50YWcpLFxuICAgIGVsZW1lbnRzOiBlbHRzXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGVtcGxhdGVFbGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5UZW1wbGF0ZUVsZW1lbnQoeyByYXdWYWx1ZTogbm9kZS52YWx1ZS5yYXcgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUZW1wbGF0ZUxpdGVyYWwobm9kZSwgdGFnKSB7XG4gIGxldCBlbHRzID0gW107XG4gIG5vZGUucXVhc2lzLmZvckVhY2goKGUsaSkgPT4ge1xuICAgIGVsdHMucHVzaChjb252ZXJ0VGVtcGxhdGVFbGVtZW50KGUpKTtcbiAgICBpZihpIDwgbm9kZS5leHByZXNzaW9ucy5sZW5ndGgpIGVsdHMucHVzaCh0b0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uc1tpXSkpO1xuICB9KTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5UZW1wbGF0ZUV4cHJlc3Npb24oe1xuICAgIHRhZzogdGFnICE9IG51bGwgPyBjb252ZXJ0KHRhZykgOiBudWxsLFxuICAgIGVsZW1lbnRzOiBlbHRzXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0WWllbGRFeHByZXNzaW9uKG5vZGUpIHtcbiAgaWYobm9kZS5kZWxlZ2F0ZSkgcmV0dXJuIG5ldyBTaGlmdC5ZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24oeyBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZS5hcmd1bWVudCkgfSk7XG4gIHJldHVybiBuZXcgU2hpZnQuWWllbGRFeHByZXNzaW9uKHsgZXhwcmVzc2lvbjogdG9FeHByZXNzaW9uKG5vZGUuYXJndW1lbnQpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0QWxsRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkV4cG9ydEFsbEZyb20oeyBtb2R1bGVTcGVjaWZpZXI6IG5vZGUuc291cmNlLnZhbHVlIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0TmFtZWREZWNsYXJhdGlvbihub2RlKSB7XG4gIGlmKG5vZGUuZGVjbGFyYXRpb24gIT0gbnVsbCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuRXhwb3J0KHtcbiAgICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICAgIGRlY2xhcmF0aW9uOiAobm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgP1xuICAgICAgICBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvbihub2RlLmRlY2xhcmF0aW9uLCB0cnVlKSA6XG4gICAgICAgIGNvbnZlcnQobm9kZS5kZWNsYXJhdGlvbilcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBuZXcgU2hpZnQuRXhwb3J0RnJvbSh7XG4gICAgbW9kdWxlU3BlY2lmaWVyOiBub2RlLnNvdXJjZSAhPSBudWxsID8gbm9kZS5zb3VyY2UudmFsdWUgOiBudWxsLFxuICAgIG5hbWVkRXhwb3J0czogbm9kZS5zcGVjaWZpZXJzLm1hcChjb252ZXJ0KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydFNwZWNpZmllcihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRXhwb3J0U3BlY2lmaWVyKHtcbiAgICBleHBvcnRlZE5hbWU6IG5vZGUuZXhwb3J0ZWQubmFtZSxcbiAgICBuYW1lOiBub2RlLmxvY2FsLm5hbWUgIT09IG5vZGUuZXhwb3J0ZWQubmFtZSA/IG5vZGUubG9jYWwubmFtZSA6IG51bGxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkV4cG9ydERlZmF1bHQoeyBib2R5OiBjb252ZXJ0KG5vZGUuZGVjbGFyYXRpb24pIH0pO1xufVxuXG5mdW5jdGlvbiB0b0ltcG9ydE5hbWVzcGFjZShub2RlLCBoYXNEZWZhdWx0U3BlY2lmaWVyKSB7XG4gIGxldCBmaXJzdEJpbmRpbmcgPSB0b0JpbmRpbmcobm9kZS5zcGVjaWZpZXJzWzBdKTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5JbXBvcnROYW1lc3BhY2Uoe1xuICAgIG1vZHVsZVNwZWNpZmllcjogbm9kZS5zb3VyY2UudmFsdWUsXG4gICAgbmFtZXNwYWNlQmluZGluZzogaGFzRGVmYXVsdFNwZWNpZmllciA/IHRvQmluZGluZyhub2RlLnNwZWNpZmllcnNbMV0pIDogZmlyc3RCaW5kaW5nLFxuICAgIGRlZmF1bHRCaW5kaW5nOiBoYXNEZWZhdWx0U3BlY2lmaWVyID8gZmlyc3RCaW5kaW5nIDogbnVsbFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltcG9ydERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgbGV0IGhhc0RlZmF1bHRTcGVjaWZpZXIgPSBub2RlLnNwZWNpZmllcnMuc29tZShzID0+IHMudHlwZSA9PT0gXCJJbXBvcnREZWZhdWx0U3BlY2lmaWVyXCIpO1xuICBpZihub2RlLnNwZWNpZmllcnMuc29tZShzID0+IHMudHlwZSA9PT0gXCJJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXJcIikpXG4gICAgcmV0dXJuIHRvSW1wb3J0TmFtZXNwYWNlKG5vZGUsIGhhc0RlZmF1bHRTcGVjaWZpZXIpO1xuXG4gIGxldCBuYW1lZEltcG9ydHMgPSBub2RlLnNwZWNpZmllcnMubWFwKGNvbnZlcnQpO1xuICBpZihoYXNEZWZhdWx0U3BlY2lmaWVyKSBuYW1lZEltcG9ydHMuc2hpZnQoKTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5JbXBvcnQoe1xuICAgIG1vZHVsZVNwZWNpZmllcjogbm9kZS5zb3VyY2UudmFsdWUsXG4gICAgbmFtZWRJbXBvcnRzLFxuICAgIGRlZmF1bHRCaW5kaW5nOiBoYXNEZWZhdWx0U3BlY2lmaWVyID8gdG9CaW5kaW5nKG5vZGUuc3BlY2lmaWVyc1swXSkgOiBudWxsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0RGVmYXVsdFNwZWNpZmllcihub2RlKSB7XG4gIHJldHVybiB0b0JpbmRpbmcobm9kZS5sb2NhbCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIobm9kZSkge1xuICByZXR1cm4gdG9CaW5kaW5nKG5vZGUubG9jYWwpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0U3BlY2lmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5JbXBvcnRTcGVjaWZpZXIoe1xuICAgIG5hbWU6IG5vZGUuaW1wb3J0ZWQubmFtZSA9PT0gbm9kZS5sb2NhbC5uYW1lID8gbnVsbCA6IG5vZGUuaW1wb3J0ZWQubmFtZSxcbiAgICBiaW5kaW5nOiB0b0JpbmRpbmcobm9kZS5sb2NhbClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTcHJlYWRFbGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5TcHJlYWRFbGVtZW50KHsgZXhwcmVzc2lvbjogdG9FeHByZXNzaW9uKG5vZGUuYXJndW1lbnQpfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGaWxlKG5vZGUpIHtcbiAgcmV0dXJuIGNvbnZlcnQobm9kZS5wcm9ncmFtKTtcbn1cblxuY29uc3QgQ29udmVydCA9IHtcbiAgQXNzaWdubWVudEV4cHJlc3Npb246IGNvbnZlcnRBc3NpZ25tZW50RXhwcmVzc2lvbixcbiAgQXNzaWdubWVudFBhdHRlcm46IGNvbnZlcnRBc3NpZ25tZW50UGF0dGVybixcbiAgQXJyYXlFeHByZXNzaW9uOiBjb252ZXJ0QXJyYXlFeHByZXNzaW9uLFxuICBBcnJheVBhdHRlcm46IGNvbnZlcnRBcnJheVBhdHRlcm4sXG4gIEFycm93RnVuY3Rpb25FeHByZXNzaW9uOiBjb252ZXJ0QXJyb3dGdW5jdGlvbkV4cHJlc3Npb24sXG4gIEJsb2NrU3RhdGVtZW50OiBjb252ZXJ0QmxvY2tTdGF0ZW1lbnQsXG4gIEJpbmFyeUV4cHJlc3Npb246IGNvbnZlcnRCaW5hcnlFeHByZXNzaW9uLFxuICBCcmVha1N0YXRlbWVudDogY29udmVydEJyZWFrU3RhdGVtZW50LFxuICBDYWxsRXhwcmVzc2lvbjogY29udmVydENhbGxFeHByZXNzaW9uLFxuICBDYXRjaENsYXVzZTogY29udmVydENhdGNoQ2xhdXNlLFxuICBDbGFzc0RlY2xhcmF0aW9uOiBjb252ZXJ0Q2xhc3NEZWNsYXJhdGlvbixcbiAgQ2xhc3NFeHByZXNzaW9uOiBjb252ZXJ0Q2xhc3NFeHByZXNzaW9uLFxuICBDbGFzc0JvZHk6IGNvbnZlcnRDbGFzc0JvZHksXG4gIENsYXNzTWV0aG9kOiBjb252ZXJ0Q2xhc3NNZXRob2QsXG4gIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogY29udmVydENvbmRpdGlvbmFsRXhwcmVzc2lvbixcbiAgQ29udGludWVTdGF0ZW1lbnQ6IGNvbnZlcnRDb250aW51ZVN0YXRlbWVudCxcbiAgRG9XaGlsZVN0YXRlbWVudDogY29udmVydERvV2hpbGVTdGF0ZW1lbnQsXG4gIERlYnVnZ2VyU3RhdGVtZW50OiBjb252ZXJ0RGVidWdnZXJTdGF0ZW1lbnQsXG4gIEVtcHR5U3RhdGVtZW50OiBjb252ZXJ0RW1wdHlTdGF0ZW1lbnQsXG4gIEV4cG9ydEFsbERlY2xhcmF0aW9uOiBjb252ZXJ0RXhwb3J0QWxsRGVjbGFyYXRpb24sXG4gIEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbjogY29udmVydEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbixcbiAgRXhwb3J0TmFtZWREZWNsYXJhdGlvbjogY29udmVydEV4cG9ydE5hbWVkRGVjbGFyYXRpb24sXG4gIEV4cG9ydFNwZWNpZmllcjogY29udmVydEV4cG9ydFNwZWNpZmllcixcbiAgRXhwcmVzc2lvblN0YXRlbWVudDogY29udmVydEV4cHJlc3Npb25TdGF0ZW1lbnQsXG4gIEZpbGU6IGNvbnZlcnRGaWxlLFxuICBGb3JTdGF0ZW1lbnQ6IGNvbnZlcnRGb3JTdGF0ZW1lbnQsXG4gIEZvck9mU3RhdGVtZW50OiBjb252ZXJ0Rm9yT2ZTdGF0ZW1lbnQsXG4gIEZvckluU3RhdGVtZW50OiBjb252ZXJ0Rm9ySW5TdGF0ZW1lbnQsXG4gIEZ1bmN0aW9uRGVjbGFyYXRpb246IGNvbnZlcnRGdW5jdGlvbkRlY2xhcmF0aW9uLFxuICBGdW5jdGlvbkV4cHJlc3Npb246IGNvbnZlcnRGdW5jdGlvbkV4cHJlc3Npb24sXG4gIElmU3RhdGVtZW50OiBjb252ZXJ0SWZTdGF0ZW1lbnQsXG4gIEltcG9ydERlY2xhcmF0aW9uOiBjb252ZXJ0SW1wb3J0RGVjbGFyYXRpb24sXG4gIEltcG9ydERlZmF1bHRTcGVjaWZpZXI6IGNvbnZlcnRJbXBvcnREZWZhdWx0U3BlY2lmaWVyLFxuICBJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXI6IGNvbnZlcnRJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXIsXG4gIEltcG9ydFNwZWNpZmllcjogY29udmVydEltcG9ydFNwZWNpZmllcixcbiAgTGl0ZXJhbDogY29udmVydExpdGVyYWwsXG4gIEJvb2xlYW5MaXRlcmFsOiBjb252ZXJ0Qm9vbGVhbkxpdGVyYWwsXG4gIE51bWVyaWNMaXRlcmFsOiBjb252ZXJ0TnVtZXJpY0xpdGVyYWwsXG4gIFN0cmluZ0xpdGVyYWw6IGNvbnZlcnRTdHJpbmdMaXRlcmFsLFxuICBSZWdFeHBMaXRlcmFsOiBjb252ZXJ0UmVnRXhwTGl0ZXJhbCxcbiAgTnVsbExpdGVyYWw6IGNvbnZlcnROdWxsTGl0ZXJhbCxcbiAgTGFiZWxlZFN0YXRlbWVudDogY29udmVydExhYmVsZWRTdGF0ZW1lbnQsXG4gIExvZ2ljYWxFeHByZXNzaW9uOiBjb252ZXJ0QmluYXJ5RXhwcmVzc2lvbixcbiAgTWVtYmVyRXhwcmVzc2lvbjogY29udmVydE1lbWJlckV4cHJlc3Npb24sXG4gIE1ldGFQcm9wZXJ0eTogY29udmVydE1ldGFQcm9wZXJ0eSxcbiAgTmV3RXhwcmVzc2lvbjogY29udmVydE5ld0V4cHJlc3Npb24sXG4gIE9iamVjdEV4cHJlc3Npb246IGNvbnZlcnRPYmplY3RFeHByZXNzaW9uLFxuICBPYmplY3RQYXR0ZXJuOiBjb252ZXJ0T2JqZWN0UGF0dGVybixcbiAgT2JqZWN0UHJvcGVydHk6IGNvbnZlcnRPYmplY3RQcm9wZXJ0eSxcbiAgUHJvZ3JhbTogY29udmVydFByb2dyYW0sXG4gIFJlc3RFbGVtZW50OiBjb252ZXJ0UmVzdEVsZW1lbnQsXG4gIFJldHVyblN0YXRlbWVudDogY29udmVydFJldHVyblN0YXRlbWVudCxcbiAgU2VxdWVuY2VFeHByZXNzaW9uOiBjb252ZXJ0U2VxdWVuY2VFeHByZXNzaW9uLFxuICBTcHJlYWRFbGVtZW50OiBjb252ZXJ0U3ByZWFkRWxlbWVudCxcbiAgU3VwZXI6IGNvbnZlcnRTdXBlcixcbiAgU3dpdGNoQ2FzZTogY29udmVydFN3aXRjaENhc2UsXG4gIFN3aXRjaFN0YXRlbWVudDogY29udmVydFN3aXRjaFN0YXRlbWVudCxcbiAgVGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uOiBjb252ZXJ0VGFnZ2VkVGVtcGxhdGVFeHByZXNzaW9uLFxuICBUZW1wbGF0ZUVsZW1lbnQ6IGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQsXG4gIFRlbXBsYXRlTGl0ZXJhbDogY29udmVydFRlbXBsYXRlTGl0ZXJhbCxcbiAgVGhpc0V4cHJlc3Npb246IGNvbnZlcnRUaGlzRXhwcmVzc2lvbixcbiAgVGhyb3dTdGF0ZW1lbnQ6IGNvbnZlcnRUaHJvd1N0YXRlbWVudCxcbiAgVHJ5U3RhdGVtZW50OiBjb252ZXJ0VHJ5U3RhdGVtZW50LFxuICBVbmFyeUV4cHJlc3Npb246IGNvbnZlcnRVbmFyeUV4cHJlc3Npb24sXG4gIFVwZGF0ZUV4cHJlc3Npb246IGNvbnZlcnRVcGRhdGVFeHByZXNzaW9uLFxuICBWYXJpYWJsZURlY2xhcmF0aW9uOiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdGlvbixcbiAgVmFyaWFibGVEZWNsYXJhdG9yOiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdG9yLFxuICBXaGlsZVN0YXRlbWVudDogY29udmVydFdoaWxlU3RhdGVtZW50LFxuICBXaXRoU3RhdGVtZW50OiBjb252ZXJ0V2l0aFN0YXRlbWVudCxcbiAgWWllbGRFeHByZXNzaW9uOiBjb252ZXJ0WWllbGRFeHByZXNzaW9uXG59O1xuXG4iXX0=