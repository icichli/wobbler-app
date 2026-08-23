import re

def validate_code(code_str):
    lines = code_str.splitlines()
    stack = []
    in_string = None
    in_comment = False
    errors = []

    for line_no, line in enumerate(lines, 1):
        i = 0
        while i < len(line):
            ch = line[i]
            nxt = line[i+1] if i + 1 < len(line) else ''
            
            if in_comment:
                if ch == '*' and nxt == '/':
                    in_comment = False
                    i += 2
                    continue
                i += 1
                continue
                
            if in_string:
                if ch == '\\':
                    i += 2
                    continue
                if ch == in_string:
                    in_string = None
                i += 1
                continue
                
            if ch == '/' and nxt == '/':
                break
                
            if ch == '/' and nxt == '*':
                in_comment = True
                i += 2
                continue
                
            if ch == '/' and nxt != '/':
                prev_chars = line[:i].rstrip()
                if not prev_chars or prev_chars[-1] in '(=[,:;!&|?{':
                    i += 1
                    in_char_class = False
                    while i < len(line):
                        if line[i] == '\\':
                            i += 2
                            continue
                        if line[i] == '[':
                            in_char_class = True
                        elif line[i] == ']' and in_char_class:
                            in_char_class = False
                        elif line[i] == '/' and not in_char_class:
                            i += 1
                            while i < len(line) and line[i].isalpha():
                                i += 1
                            break
                        i += 1
                    continue

            if ch in ('"', "'", '`'):
                in_string = ch
                i += 1
                continue
                
            if ch in ('(', '{', '['):
                stack.append((ch, line_no, i))
            elif ch in (')', '}', ']'):
                if not stack:
                    errors.append(f"Error: unexpected '{ch}' at line {line_no}:{i}")
                else:
                    top, top_line, top_col = stack.pop()
                    expected = {'(': ')', '{': '}', '[': ']'}[top]
                    if ch != expected:
                        errors.append(f"Mismatched bracket: expected '{expected}' (opened at line {top_line}) but found '{ch}' at line {line_no}:{i}")
            i += 1

    if stack:
        for top, top_line, top_col in stack:
            errors.append(f"Unclosed bracket '{top}' opened at line {top_line}")
            
    return errors
