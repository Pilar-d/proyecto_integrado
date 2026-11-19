"""
Evaluador seguro de fórmulas matemáticas y celdas REM utilizando simpleeval.
Proporciona evaluación segura en sandbox sin uso de eval() arbitrario,
protegiendo contra inyección de código y ejecución no autorizada.
"""

import math
import re
from decimal import Decimal
import simpleeval
from simpleeval import (
    EvalWithCompoundTypes,
    FeatureNotAvailable,
    FunctionNotDefined,
    NameNotDefined,
    InvalidExpression,
    NumberTooHigh,
)


class EvaluadorSeguroError(Exception):
    """Excepción base para errores del evaluador seguro."""
    pass


class EvaluadorSeguroFormulas:
    """
    Evaluador seguro de expresiones y fórmulas basado en simpleeval.
    Soporta operaciones aritméticas, funciones estadísticas y resolución de celdas REM.
    """

    def __init__(self):
        self._evaluator = EvalWithCompoundTypes()
        
        # Funciones matemáticas seguras permitidas
        self._evaluator.functions = {
            'sum': self._func_sum,
            'promedio': self._func_promedio,
            'avg': self._func_promedio,
            'min': min,
            'max': max,
            'round': round,
            'abs': abs,
            'sqrt': math.sqrt,
            'ceil': math.ceil,
            'floor': math.floor,
            'porcentaje': lambda n, d: ((n / d) * 100.0) if d else 0.0,
            'tasa': lambda n, d, b=10000: ((n / d) * float(b)) if d else 0.0,
            'razon': lambda n, d: (n / d) if d else 0.0,
        }

    @staticmethod
    def _func_sum(*args):
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            return sum(args[0])
        return sum(args)

    @staticmethod
    def _func_promedio(*args):
        items = args[0] if (len(args) == 1 and isinstance(args[0], (list, tuple))) else args
        return (sum(items) / len(items)) if items else 0.0

    def evaluar(self, expresion: str, variables: dict = None) -> Decimal:
        """
        Evalúa una expresión matemática con variables provistas de manera 100% segura.
        """
        if not expresion or not str(expresion).strip():
            raise EvaluadorSeguroError("La expresión de fórmula no puede estar vacía.")

        expr = str(expresion).strip()
        variables = variables or {}

        # Mapear variables a float para simpleeval
        names = {}
        for k, v in variables.items():
            if isinstance(v, (int, float, Decimal)):
                names[k] = float(v)
            else:
                names[k] = v
        self._evaluator.names = names

        try:
            resultado = self._evaluator.eval(expr)
            if resultado is None:
                return Decimal('0')
            return Decimal(str(resultado))
        except ZeroDivisionError:
            raise EvaluadorSeguroError(f"División por cero en la fórmula: '{expr}'")
        except NameNotDefined as e:
            raise EvaluadorSeguroError(f"Variable no definida en la fórmula: {e}")
        except FunctionNotDefined as e:
            raise EvaluadorSeguroError(f"Función no permitida o desconocida en la fórmula: {e}")
        except FeatureNotAvailable as e:
            raise EvaluadorSeguroError(f"Operación no permitida por seguridad: {e}")
        except InvalidExpression as e:
            raise EvaluadorSeguroError(f"Sintaxis de expresión inválida: '{expr}' ({e})")
        except Exception as e:
            raise EvaluadorSeguroError(f"Error evaluando fórmula '{expr}': {e}")

    def evaluar_celdas_rem(self, especificacion: str, lector_celda) -> Decimal:
        """
        Resuelve una especificación de celdas o rangos REM usando simpleeval.
        Soporta:
          - Celda individual: 'D11'
          - Rango continuo: 'H11:X11'
          - Fórmulas y operaciones: 'D11 + D12 - F11', '(D11 + D12) * 0.5', 'sum(H11:X11, D12)'
        """
        especificacion = especificacion.strip()
        if not especificacion:
            return Decimal('0')

        # 1. Caso directo de celda simple (ej: 'D11')
        if re.fullmatch(r'^[A-Za-z]+[0-9]+$', especificacion):
            return lector_celda(especificacion)

        # 2. Caso directo de rango simple (ej: 'H11:X11')
        if re.fullmatch(r'^[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+$', especificacion):
            return lector_celda(especificacion)

        # 3. Expresión compleja con celdas, rangos y operadores
        # Detectar y reemplazar rangos con variables temporales
        expr = especificacion
        variables = {}
        ranges = re.findall(r'[A-Za-z]+[0-9]+:[A-Za-z]+[0-9]+', especificacion)
        for idx, r in enumerate(ranges):
            var_name = f'_RANGO_{idx}'
            expr = expr.replace(r, var_name)
            variables[var_name] = lector_celda(r)

        # Detectar celdas individuales (letras seguidas de números)
        cells = re.findall(r'\b[A-Za-z]+[0-9]+\b', expr)
        for c in cells:
            if c not in variables and not c.startswith('_RANGO_'):
                variables[c] = lector_celda(c)

        # Evaluar de forma segura con simpleeval
        return self.evaluar(expr, variables)

    @classmethod
    def validar_expresion(cls, expresion: str, variables_permitidas: list = None) -> tuple[bool, str]:
        """
        Valida que una expresión tenga sintaxis válida y no intente invocar funciones prohibidas.
        Retorna (True, "") o (False, "mensaje de error").
        """
        try:
            evaluador = cls()
            test_vars = {v: 1.0 for v in (variables_permitidas or ['n', 'd', 'numerador', 'denominador', 'poblacion'])}
            evaluador.evaluar(expresion, test_vars)
            return True, "Fórmula válida y segura."
        except Exception as e:
            return False, str(e)


# Instancia singleton para uso general
evaluador_seguro = EvaluadorSeguroFormulas()
