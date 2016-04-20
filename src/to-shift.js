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

import * as Shift from "shift-ast";

// convert SpiderMonkey AST format to Shift AST format

export default function convert(node) {
  if (node == null) {
    return null;
  }

  if(Convert[node.type] === convert) throw Error(`convert${node.type} not implemented.`);

  return Convert[node.type](node);
}

function convertAssignmentExpression(node) {
  return new Shift.AssignmentExpression({
    binding: convert(node.left),//new Shift.BindingIdentifier({ name: node.left.name }),
    expression: convert(node.right)
  });
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
  return new Shift.BreakStatement({ label: convertIdentifier(node.label) });
}

function convertCallExpression(node) {
  return new Shift.CallExpression({
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  });
}

function convertCatchClause(node) {
  return new Shift.CatchClause({
    binding: convertIdentifier(node.param),
    body: convertBlock(node.body)
  });
}

function convertConditionalExpression(node) {
  return new Shift.ConditionalExpression({
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertContinueStatement(node) {
  return new Shift.ContinueStatement({ label: convertIdentifier(node.label) });
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
  return new Shift.ExpressionStatement({ expression: convert(node.expression) });
}

function convertForStatement(node) {
  let init = node.init != null && node.init.type === "VariableDeclaration" ?
      convertVariableDeclaration(node.init) :
      convert(node.init);
  return new Shift.ForStatement({
    init,
    test: convert(node.test),
    update: convert(node.update),
    body: convert(node.body)
  });
}

function convertForInStatement(node) {
  let left = node.left.type === "VariableDeclaration" ?
      convertVariableDeclaration(node.left) :
      convert(node.left);
  return new Shift.ForInStatement({ left, right: convert(node.right), body: convert(node.body) });
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration({
    isGenerator: node.generator,
    name: convertIdentifier(node.id),
    params: node.params.map(convertIdentifier),
    body: convertStatementsToFunctionBody(node.body.body)
  });
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression({
    isGenerator: node.generator,
    name: convertIdentifier(node.id),
    params: node.params.map(convertIdentifier),
    body: convertStatementsToFunctionBody(node.body.body)
  });
}

function convertIdentifier(node) {
  if (node === null) return null;
  return new Shift.BindingIdentifier(node);
}

/*function convertIdentifierExpression(node) {
  return new Shift.IdentifierExpression({ name: convertIdentifier(node) });
}*/

function convertIfStatement(node) {
  return new Shift.IfStatement({
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertLabeledStatement(node) {
  return new Shift.LabeledStatement({
    label: convertIdentifier(node.label),
    body: convert(node.body)
  });
}

function convertLiteral(node) {
  switch (typeof node.value) {
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
    if (node.value === null)
      return new Shift.LiteralNullExpression();
    else
      return new Shift.LiteralRegExpExpression(node.regex);
  }
}

function convertMemberExpression(node) {
  if (node.computed) {
    return new Shift.ComputedMemberExpression({
      object: convert(node.object),
      expression: convert(node.property)
    });
  }
  return new Shift.StaticMemberExpression({
    object: convert(node.object),
    property: convertIdentifier(node.property)
  });
}

function convertNewExpression(node) {
  return new Shift.NewExpression({
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  });
}

function convertObjectExpression(node) {
  return new Shift.ObjectExpression({ properties: node.properties.map(convert) });
}

function convertDirective(node) {
  node = node.expression;
  var value = node.value;
  return new Shift.Directive({rawValue: value});
  //return value === "use strict" ? new Shift.UseStrictDirective() : new Shift.UnknownDirective(value);
}

function convertStatementsToFunctionBody(stmts) {
  for (var i = 0; i < stmts.length; i++) {
    if (!(stmts[i].type === "ExpressionStatement" && stmts[i].expression.type === "Literal" && typeof stmts[i].expression.value === "string")) {
      break;
    }
  }
  return new Shift.FunctionBody({
    directives: stmts.slice(0, i).map(convertDirective),
    statements: stmts.slice(i).map(convert)
  });
}

function convertProgram(node) {
  let directives = node.directives ? node.directives.map(convertDirective) : [],
      statements = convertStatementsToFunctionBody(node.body);

  if(node.sourceType === "module") {
    return new Shift.Module({ directives, items: statements });
  }
  return new Shift.Script({ directives, statements });
}

function convertPropertyName(node) {
  if (node.type === "Literal") {
    return new Shift.StaticPropertyName(node);
  } else if(node.type === "Identifier") {
    return new Shift.StaticPropertyName({ value: node.name });
    //return new Shift.BindingIdentifier(node);
  } else {
    return new Shift.ComputedPropertyName({ expression: convert(node.value) });
  }
}

function convertProperty(node) {
  let name = convert(node.key),
      body = convert(node.value);
  switch (node.kind) {
  case "init":
    if(node.shorthand) {
      let init;
      let binding = convert(node.value.left);
      if(node.value.type === "AssignmentPattern") {
        init = convert(node.value.right);
      } else {
        init = null;
      }
      return new Shift.BindingPropertyIdentifier({binding, init});
    } else if(node.method) {
      let name;
      if(node.computed) {
        name = new Shift.ComputedPropertyName({ expression: convert(node.key)});
      } else if(node.key.type === "Identifier") {
        name = new Shift.StaticPropertyName({ value: node.key.name });
      } else {
        name = new Shift.StaticPropertyName({ value: node.key.value.toString() });
      }
      return new Shift.Method({
        isGenerator: node.value.generator,
        name,
        body: convert(node.value.body),
        params: convertFunctionParams(node.value)
      });
    } else {
      if(node.key.type === "Identifier" && "Identifier" === node.value.type) {
        return new Shift.BindingPropertyProperty({ name, binding: body });
      }
      return new Shift.DataProperty({ name, expression: body });
    }
  case "get":
    return new Shift.Getter({ name, body });
  case "set":
    return new Shift.Setter({ name, body, param: convertIdentifier(node.value.params[0]) });
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement({ expression: convert(node.argument) });
}

function convertSequenceExpression(node) {
  var expr = convert(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new Shift.BinaryExpression({
      operator: ",",
      left: expr,
      right: convert(node.expressions[i])
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
  if (!node.cases.every((c) => c.test != null )) {
    var scs = node.cases.map(convertSwitchCase);
    for (var i = 0; i < scs.length; i++) {
      if (scs[i].type === "SwitchDefault") {
        break;
      }
    }
    return new Shift.SwitchStatementWithDefault({
      discriminant: convert(node.discriminant),
      preDefaultCases: scs.slice(0, i),
      defaultCase: scs[i],
      postDefaultCases: scs.slice(i + 1)
    });
  }
  return new Shift.SwitchStatement({
    discriminant: convert(node.discriminant),
    cases: node.cases.map(convertSwitchCase)
  });
}

function convertThisExpression() {
  return new Shift.ThisExpression();
}

function convertThrowStatement(node) {
  return new Shift.ThrowStatement({ expression: convert(node.argument) });
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new Shift.TryFinallyStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      finalizer: convertBlockStatement(node.finalizer)
    });
  }
  return new Shift.TryCatchStatement({
    body: convertBlock(node.block),
    catchClause: convertCatchClause(node.handler),
    handlers: node.handlers.map(convert)
  });
}

function convertUpdateExpression(node) {
  return new Shift.UpdateExpression({
    isPrefix: node.prefix,
    operator: node.operator,
    operand: convert(node.argument)
  });
}

function convertUnaryExpression(node) {
  /*    return new Shift.UpdateExpression({
        isPrefix: node.prefix,
        operator: node.operator,
        operand: convert(node.argument)
        });*/
  return new Shift.UnaryExpression({
    operator: node.operator,
    operand: convert(node.argument)
  });
}

function convertVariableDeclaration(node) {
  return new Shift.VariableDeclaration({
    kind: node.kind,
    declarators: node.declarations.map(convertVariableDeclarator)
  });
}

function convertVariableDeclarationStatement(node) {
  return new Shift.VariableDeclarationStatement({ declaration: convertVariableDeclaration(node) });
}

function convertVariableDeclarator(node) {
  return new Shift.VariableDeclarator({
    binding: convertIdentifier(node.id),
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
  if(node.meta === "new" && node.property === "target") {
    return new Shift.NewTargetExpression();
  }
  return null;
}

function convertForOfStatement(node) {
  return new Shift.ForOfStatement({
    left: convert(node.left),
    right: convert(node.right),
    body: convert(node.body)
  });
}

function convertObjectPattern(node) {
  return new Shift.ObjectBinding({ properties: node.properties.map(convert)});
}

function convertAssignmentPattern(node) {
  return new Shift.BindingPropertyIdentifier({
    binding: convert(node.left),
    init: convert(node.right)
  });
}

function convertClassDeclaration(node) {
  return new Shift.ClassDeclaration({
    name: convert(node.id),
    super: convert(node.superClass),
    elements: node.body.body.map(convert)
  });
}

function convertClassExpression(node) {
  let {name,super:spr,elements} = convertClassDeclaration(node);
  return new Shift.ClassExpression({ name, super:spr, elements });
}

function convertArrayPattern(node) {
  let eltCount = node.elements.length,
      rest = node.elements[eltCount-1],
      config;
  if(rest != null && rest.type === "RestElement") {
    config = {
      elements: node.elements.slice(0,eltCount-1).map(v => {
        if(v.type === "AssignmentPattern") {
          return new Shift.BindingWithDefault({ binding: convert(v.left), init: convert(v.right)});
        }
        return convert(v);
      }),
      restElement: convert(rest.argument)
    };
  } else {
    config = { elements: node.elements.map(convert), restElement: null };
  }
  return new Shift.ArrayBinding(config);
}

function convertArrowFunctionExpression(node) {
  return new Shift.ArrowExpression({
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: convert(node.body)
  });
}

function convertFunctionParams(node) {
  let paramCount = node.params.length,
      rest = node.params[paramCount-1],
      paramConfig;
  if(rest != null && rest.type === "RestElement") {
    paramConfig = {
      items: node.params.slice(0,paramCount-1).map(convert),
      rest: convert(rest.argument)
    };
  } else {
    paramConfig = { items: node.params.map(convert), rest: null };
  }
  if(node.defaults.length > 0) {
    paramConfig.items = paramConfig.items.map((v,i) => {
      if(v != null) {
        return new Shift.BindingWithDefault({ binding: v, init: convert(node.defaults[i]) });
      }
      return v;
    });
  }
  return paramConfig;
}

function convertMethodDefinition(node) {
  return new Shift.ClassElement({
    isStatic: node.static,
    method: new Shift.Method({
      isGenerator: node.value.generator,
      //TODO: fix name resolution. identifier conversion assumes bindingidentifier
        name: new Shift.StaticPropertyName({ value: node.key.name }),//convertPropertyName(node.key),
      params: new Shift.FormalParameters(convertFunctionParams(node.value)),
      body: convertStatementsToFunctionBody(node.value.body.body)
    })
  });
}

function convertSuper(node) {
  return new Shift.Super();
}

function convertTaggedTemplateExpression(node) {
  let elts = [];
  node.quasi.quasis.forEach((e,i) => {
    elts.push(convert(e));
    if(i < node.quasi.expressions.length) elts.push(convert(node.quasi.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: convert(node.tag),
    elements: elts
  });
}

function convertTemplateElement(node) {
  return new Shift.TemplateElement({ rawValue: node.value.raw });
}

function convertYieldExpression(node) {
  if(node.delegate) return new Shift.YieldGeneratorExpression({ expression: convert(node.argument) });
  return new Shift.YieldExpression({ expression: convert(node.argument) });
}

function convertExportAllDeclaration(node) {
  return new Shift.ExportAllFrom({ moduleSpecifier: node.source.value });
}

function convertExportNamedDeclaration(node) {
  let declaration;
  if(node.declaration != null) {
    return new Shift.Export({
      kind: node.kind,
      declaration: convert(node.declaration)
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

function convertImportDeclaration(node) {
  let hasDefaultSpecifier = node.specifiers.some(s => s.type === "ImportDefaultSpecifier"),
      hasNamespaceSpecifier = node.specifiers.some(s => s.type === "ImportNamespaceSpecifier"),
      defaultBinding = hasDefaultSpecifier ? convert(node.specifiers[0]): null;

  if(hasNamespaceSpecifier) {
    return new Shift.ImportNamespace({
      moduleSpecifier: node.source.value,
      namespaceBinding: convert(node.specifiers[1]),
      defaultBinding
    });
  }

  let namedImports = node.specifiers.map(convert);
  if(hasDefaultSpecifier) namedImports.shift();
  return new Shift.Import({
    moduleSpecifier: node.source.value,
    namedImports,
    defaultBinding
  });
}

function convertImportDefaultSpecifier(node) {
  return convert(node.local);
}

function convertImportNamespaceSpecifier(node) {
  return convert(node.local);
}

function convertImportSpecifier(node) {
  return new Shift.ImportSpecifier({ name: node.imported.name, binding: convert(node.local) });
}

const Convert = {
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
  ClassBody: convert,
  ClassDeclaration: convertClassDeclaration,
  ClassExpression: convertClassExpression,
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
  ForStatement: convertForStatement,
  ForOfStatement: convertForOfStatement,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  Identifier: convertIdentifier,
  IfStatement: convertIfStatement,
  ImportDeclaration: convertImportDeclaration,
  ImportDefaultSpecifier: convertImportDefaultSpecifier,
  ImportNamespaceSpecifier: convertImportNamespaceSpecifier,
  ImportSpecifier: convertImportSpecifier,
  Literal: convertLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  MetaProperty: convertMetaProperty,
  MethodDefinition: convertMethodDefinition,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  ObjectPattern: convertObjectPattern,
  Program: convertProgram,
  Property: convertProperty,
  RestElement: convert,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SpreadElement: convert,
  Super: convertSuper,
  SwitchStatement: convertSwitchStatement,
  SwitchCase: convertSwitchCase,
  TaggedTemplateExpression: convertTaggedTemplateExpression,
  TemplateElement: convertTemplateElement,
  TemplateLiteral: convert,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclarationStatement,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,
  YieldExpression: convertYieldExpression
};
