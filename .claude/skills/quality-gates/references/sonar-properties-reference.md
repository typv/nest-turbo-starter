# SonarQube Properties Reference

Snippets for wizard to compose sonar-project.properties per detected stack.

## Node/TypeScript

```properties
sonar.sources=src
sonar.tests=__tests__,test,tests
sonar.test.inclusions=**/*.test.*,**/*.spec.*
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**,**/.next/**
```

## Python

```properties
sonar.sources=src,app
sonar.tests=tests
sonar.python.coverage.reportPaths=coverage.xml
sonar.python.version=3
sonar.exclusions=**/__pycache__/**,**/.venv/**
```

## Go

```properties
sonar.sources=.
sonar.tests=.
sonar.test.inclusions=**/*_test.go
sonar.go.coverage.reportPaths=coverage.out
```

## Java/Kotlin

```properties
sonar.sources=src/main
sonar.tests=src/test
sonar.java.binaries=target/classes
sonar.java.source=17
sonar.exclusions=**/target/**
```

## .NET

```properties
sonar.sources=src
sonar.tests=test,tests
sonar.cs.opencover.reportsPaths=**/coverage.cobertura.xml
```

## Common Settings

```properties
sonar.qualitygate.wait=true
sonar.sourceEncoding=UTF-8
```

## PR Decoration (Developer Edition+ / SonarCloud only)

```properties
sonar.pullrequest.key=${PR_NUMBER}
sonar.pullrequest.branch=${HEAD_BRANCH}
sonar.pullrequest.base=${BASE_BRANCH}
```

> Note: `sonar.pullrequest.*` and `sonar.branch.name` require SonarQube Developer Edition or SonarCloud. Community Edition ignores these params.

## Monorepo

```properties
sonar.projectBaseDir=packages/api
```

## Coverage Exclusions (common)

```properties
sonar.coverage.exclusions=**/migrations/**,**/generated/**,**/*.test.*,**/*_test.*
sonar.cpd.exclusions=**/generated/**,**/migrations/**
```
