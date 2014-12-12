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

import * as LaserBat from "laserbat-ast";

// convert SpiderMonkey AST format to LaserBat AST format

export default function convert(node) {
  if (node == null) {
    return null;
  }
  return Convert[node.type](node);
}

function convertAssignmentExpression(node) {
  return new LaserBat.AssignmentExpression(node.operator, convert(node.left), convert(node.right));
}

function convertArrayExpression(node) {
  return new LaserBat.ArrayExpression(node.elements.map(convert));
}

function convertBinaryExpression(node) {
  return new LaserBat.BinaryExpression(node.operator, convert(node.left), convert(node.right));
}

function convertBlock(node) {
  return new LaserBat.Block(node.body.map(convert));
}

function convertBlockStatement(node) {
  return new LaserBat.BlockStatement(convertBlock(node));
}

function convertBreakStatement(node) {
  return new LaserBat.BreakStatement(convertIdentifier(node.label));
}

function convertCallExpression(node) {
  return new LaserBat.CallExpression(convert(node.callee), node.arguments.map(convert));
}

function convertCatchClause(node) {
  return new LaserBat.CatchClause(convertIdentifier(node.param), convertBlock(node.body));
}

function convertConditionalExpression(node) {
  return new LaserBat.ConditionalExpression(convert(node.test), convert(node.consequent), convert(node.alternate));
}

function convertContinueStatement(node) {
  return new LaserBat.ContinueStatement(convertIdentifier(node.label));
}

function convertDebuggerStatement() {
  return new LaserBat.DebuggerStatement();
}

function convertDoWhileStatement(node) {
  return new LaserBat.DoWhileStatement(convert(node.body), convert(node.test));
}

function convertEmptyStatement() {
  return new LaserBat.EmptyStatement();
}

function convertExpressionStatement(node) {
  return new LaserBat.ExpressionStatement(convert(node.expression));
}

function convertForStatement(node) {
  var init = null;
  if (node.init != null) {
    if (node.init.type === 'VariableDeclaration') {
      init = convertVariableDeclaration(node.init);
    } else {
      init = convert(node.init);
    }
  }
  return new LaserBat.ForStatement(init, convert(node.test), convert(node.update), convert(node.body));
}

function convertForInStatement(node) {
  var left = null;
  if (node.left != null) {
    if (node.left.type === 'VariableDeclaration') {
      left = convertVariableDeclaration(node.left);
    } else {
      left = convert(node.left);
    }
  }
  return new LaserBat.ForInStatement(left, convert(node.right), convert(node.body));
}

function convertFunctionDeclaration(node) {
  return new LaserBat.FunctionDeclaration(convertIdentifier(node.id), node.params.map(convertIdentifier), convertStatementsToFunctionBody(node.body.body));
}

function convertFunctionExpression(node) {
  return new LaserBat.FunctionExpression(convertIdentifier(node.id), node.params.map(convertIdentifier), convertStatementsToFunctionBody(node.body.body));
}

function convertIdentifier(node) {
  if (node === null) return null;
  return new LaserBat.Identifier(node.name);
}

function convertIdentifierExpression(node) {
  return new LaserBat.IdentifierExpression(convertIdentifier(node));
}

function convertIfStatement(node) {
  return new LaserBat.IfStatement(convert(node.test), convert(node.consequent), convert(node.alternate));
}

function convertLabeledStatement(node) {
  return new LaserBat.LabeledStatement(convertIdentifier(node.label), convert(node.body));
}

function convertLiteral(node) {
  switch (typeof node.value) {
    case "number":
      return new LaserBat.LiteralNumericExpression(node.value);
    case "string":
      return new LaserBat.LiteralStringExpression(node.value);
    case "boolean":
      return new LaserBat.LiteralBooleanExpression(node.value);
    default:
      if (node.value === null)
        return new LaserBat.LiteralNullExpression();
      else
        return new LaserBat.LiteralRegExpExpression(node.value.toString());
  }
}

function convertMemberExpression(node) {
  if (node.computed) {
    return new LaserBat.ComputedMemberExpression(convert(node.object), convert(node.property));
  } else {
    return new LaserBat.StaticMemberExpression(convert(node.object), convertIdentifier(node.property));
  }
}

function convertNewExpression(node) {
  return new LaserBat.NewExpression(convert(node.callee), node.arguments.map(convert));
}

function convertObjectExpression(node) {
  return new LaserBat.ObjectExpression(node.properties.map(convert));
}

function convertDirective(node) {
  node = node.expression;
  var value = node.value;
  return value === "use strict" ? new LaserBat.UseStrictDirective() : new LaserBat.UnknownDirective(value);
}

function convertStatementsToFunctionBody(stmts) {
  for (var i = 0; i < stmts.length; i++) {
    if (!(stmts[i].type === "ExpressionStatement" && stmts[i].expression.type === "Literal" && typeof stmts[i].expression.value === "string")) {
      break;
    }
  }
  return new LaserBat.FunctionBody(stmts.slice(0, i).map(convertDirective), stmts.slice(i).map(convert));
}

function convertProgram(node) {
  return new LaserBat.Script(convertStatementsToFunctionBody(node.body));
}

function convertPropertyName(literal) {
  if (literal.type === "Identifier") {
    return new LaserBat.PropertyName("identifier", literal.name);
  } else {
    return new LaserBat.PropertyName(typeof literal.value, literal.value.toString());
  }
}

function convertProperty(node) {
  switch (node.kind) {
    case "init":
      return new LaserBat.DataProperty(convertPropertyName(node.key), convert(node.value));
    case "get":
      return new LaserBat.Getter(convertPropertyName(node.key), convertStatementsToFunctionBody(node.value.body.body));
    case "set":
      return new LaserBat.Setter(convertPropertyName(node.key), convertIdentifier(node.value.params[0]), convertStatementsToFunctionBody(node.value.body.body));
  }
}

function convertReturnStatement(node) {
  return new LaserBat.ReturnStatement(convert(node.argument));
}

function convertSequenceExpression(node) {
  var expr = convert(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new LaserBat.BinaryExpression(",", expr, convert(node.expressions[i]));
  }
  return expr;
}

function convertSwitchCase(node) {
  if (node.test) {
    return new LaserBat.SwitchCase(convert(node.test), node.consequent.map(convert));
  } else {
    return new LaserBat.SwitchDefault(node.consequent.map(convert));
  }
}

function convertSwitchStatement(node) {
  if (!node.cases.every((c) => c.test != null )) {
    var scs = node.cases.map(convertSwitchCase);
    for (var i = 0; i < scs.length; i++) {
      if (scs[i].type === "SwitchDefault") {
        break;
      }
    }
    return new LaserBat.SwitchStatementWithDefault(convert(node.discriminant), scs.slice(0, i), scs[i], scs.slice(i + 1));
  } else {
    return new LaserBat.SwitchStatement(convert(node.discriminant), node.cases.map(convertSwitchCase));
  }
}

function convertThisExpression() {
  return new LaserBat.ThisExpression();
}

function convertThrowStatement(node) {
  return new LaserBat.ThrowStatement(convert(node.argument));
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new LaserBat.TryFinallyStatement(convertBlock(node.block), convert(node.handlers[0]), convertBlock(node.finalizer));
  } else {
    return new LaserBat.TryCatchStatement(convertBlock(node.block), convert(node.handlers[0]));
  }
}

function convertUpdateExpression(node) {
  if (node.prefix) {
    return new LaserBat.PrefixExpression(node.operator, convert(node.argument));
  } else {
    return new LaserBat.PostfixExpression(convert(node.argument), node.operator);
  }
}

function convertUnaryExpression(node) {
  return new LaserBat.PrefixExpression(node.operator, convert(node.argument));
}

function convertVariableDeclaration(node) {
  return new LaserBat.VariableDeclaration(node.kind, node.declarations.map(convertVariableDeclarator));
}

function convertVariableDeclarationStatement(node) {
  return new LaserBat.VariableDeclarationStatement(convertVariableDeclaration(node));
}

function convertVariableDeclarator(node) {
  return new LaserBat.VariableDeclarator(convertIdentifier(node.id), convert(node.init));
}

function convertWhileStatement(node) {
  return new LaserBat.WhileStatement(convert(node.test), convert(node.body));
}

function convertWithStatement(node) {
  return new LaserBat.WithStatement(convert(node.object), convert(node.body));
}

const Convert = {
  AssignmentExpression: convertAssignmentExpression,
  ArrayExpression: convertArrayExpression,
  BlockStatement: convertBlockStatement,
  BinaryExpression: convertBinaryExpression,
  BreakStatement: convertBreakStatement,
  CallExpression: convertCallExpression,
  CatchClause: convertCatchClause,
  ConditionalExpression: convertConditionalExpression,
  ContinueStatement: convertContinueStatement,
  DoWhileStatement: convertDoWhileStatement,
  DebuggerStatement: convertDebuggerStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForStatement: convertForStatement,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  Identifier: convertIdentifierExpression,
  IfStatement: convertIfStatement,
  Literal: convertLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  Program: convertProgram,
  Property: convertProperty,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SwitchStatement: convertSwitchStatement,
  SwitchCase: convertSwitchCase,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclarationStatement,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement
};
