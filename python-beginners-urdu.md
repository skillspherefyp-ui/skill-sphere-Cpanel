# Python for Beginners (Urdu) — Complete Course Content

## Course Description

Master the fundamentals of programming using Python, one of the most beginner-friendly and
in-demand languages in the world — taught entirely in Urdu so nothing gets lost in translation.
Built for absolute beginners, this course takes you from zero coding knowledge to writing
real, working programs with confidence. Every topic is explained clearly in simple Urdu
with practical examples, live coding demonstrations, and exercises that reinforce your
understanding at every step.

What you will learn:
- How computers work and how Python programs are executed
- Setting up your Python development environment (VS Code + Python Interpreter)
- Variables, data types, and constants
- Arithmetic, relational, and logical operators
- User input and output using print() and input()
- Conditional statements: if, elif, and else with real examples
- Loops: for and while with practical use cases
- Functions: definition, parameters, return values, and scope
- Lists, tuples, and how to work with collections
- Dictionaries and sets for storing structured data
- String operations and common string methods
- File handling: reading and writing files
- Error handling using try and except
- Introduction to Object-Oriented Programming: classes and objects

Who this course is for:
- Complete beginners with no programming experience
- Urdu-speaking students who want to learn coding in their native language
- Students studying computer science or software engineering
- Anyone who wants a strong Python foundation before moving to advanced topics

By the end of this course you will be able to:
- Write, run, and debug Python programs from scratch
- Break down problems and translate them into working code
- Understand how data is stored and manipulated in memory
- Build a solid base to continue into data science, web development, or automation

---

## Topic 1: Python اور Programming کا تعارف

### 1.1 Programming کیا ہے؟
- پروگرامنگ کمپیوٹر کو ہدایات دینے کا عمل ہے تاکہ وہ ایک مخصوص کام کرے
- ہر پروگرام ہدایات کا ایک سلسلہ ہے جو کمپیوٹر اوپر سے نیچے ترتیب سے چلاتا ہے
- پروگرامر وہ شخص ہے جو یہ ہدایات لکھتا، جانچتا اور ٹھیک کرتا ہے
- Hardware: کمپیوٹر کے وہ حصے جنہیں چھوا جا سکتا ہے جیسے CPU، RAM، keyboard
- Software: وہ پروگرام اور data جو hardware کو چلاتے ہیں

### 1.2 Python کیا ہے اور کہاں استعمال ہوتی ہے؟
- Python ایک high-level programming language ہے جسے Guido van Rossum نے 1991 میں بنایا
- Python کا syntax آسان اور انگریزی جیسا ہے اس لیے beginners کے لیے بہترین ہے
- استعمال: web development، data science، artificial intelligence، automation، scripting
- Python interpreter code کو line by line چلاتا ہے برخلاف C++ کے جو compile کرتا ہے
- Python مفت اور open source ہے اور ہر operating system پر چلتی ہے

### 1.3 Python بمقابلہ دوسری زبانیں
- Python vs C++: Python آسان لیکن سست، C++ مشکل لیکن تیز
- Python vs Java: Python میں کم code لکھنا پڑتا ہے، Java زیادہ verbose ہے
- Python vs JavaScript: Python سرور اور data کے لیے، JavaScript browser کے لیے
- Python beginners کے لیے پہلی زبان کے طور پر دنیا بھر میں سب سے زیادہ پڑھائی جاتی ہے

### 1.4 Python پروگرام کیسے چلتا ہے؟
- آپ .py فائل میں code لکھتے ہیں
- Python interpreter فائل پڑھتا ہے اور ہر line کو bytecode میں بدلتا ہے
- Python Virtual Machine (PVM) وہ bytecode چلاتا ہے
- نتیجہ screen پر دکھایا جاتا ہے
- Compiled languages (C++) میں یہ کام run سے پہلے ہوتا ہے، Python میں run کے وقت ہوتا ہے

---

## Topic 2: Python انسٹال کرنا اور VS Code سیٹ اپ

### 2.1 Python ڈاؤن لوڈ اور انسٹال کرنا
- python.org پر جائیں اور Downloads section سے latest version چنیں
- Windows کے لیے .exe installer ڈاؤن لوڈ کریں
- Installer چلائیں اور سب سے پہلے "Add Python to PATH" کا checkbox ضرور لگائیں
- Install Now پر کلک کریں اور انسٹالیشن مکمل ہونے کا انتظار کریں
- تصدیق کے لیے Command Prompt کھولیں اور `python --version` ٹائپ کریں

### 2.2 VS Code ڈاؤن لوڈ اور انسٹال کرنا
- code.visualstudio.com پر جائیں اور Windows کے لیے installer ڈاؤن لوڹ کریں
- Installer چلائیں اور default settings کے ساتھ انسٹال کریں
- VS Code کھولیں، Extensions panel کھولیں (Ctrl+Shift+X)
- "Python" سرچ کریں اور Microsoft کی Python extension انسٹال کریں
- یہ extension syntax highlighting، auto-complete اور debugging فراہم کرتی ہے

### 2.3 پہلا Python پروگرام
- VS Code میں نئی فائل بنائیں اور hello.py نام دیں
- لکھیں: `print("Hello, World!")`
- Terminal کھولیں (Ctrl+`) اور `python hello.py` چلائیں
- Output: `Hello, World!`
- print() Python کا سب سے بنیادی output function ہے

### 2.4 Python Interactive Shell
- Command Prompt یا VS Code Terminal میں صرف `python` ٹائپ کریں
- `>>>` prompt آتا ہے — یہ interactive shell ہے
- یہاں آپ فوراً code لکھ کر نتیجہ دیکھ سکتے ہیں بغیر فائل بنائے
- مثال: `>>> 5 + 3` لکھیں تو فوراً `8` آتا ہے
- Exit کے لیے `exit()` ٹائپ کریں

---

## Topic 3: Variables اور Data Types

### 3.1 Variable کیا ہے؟
- Variable ایک نام ہے جو memory میں ایک جگہ کو refer کرتا ہے جہاں data store ہوتا ہے
- سوچیں ایک ڈبہ جس پر label لگا ہو — label variable کا نام ہے، ڈبے میں value ہے
- Python میں variable declare کرنے کے لیے صرف نام = value لکھیں: `age = 20`
- Variable کی value بعد میں بدلی جا سکتی ہے: `age = 21`
- Naming rules: صرف حروف، اعداد اور underscore، پہلا حرف عدد نہ ہو، spaces نہیں

### 3.2 Python کے بنیادی Data Types
- **int**: پورے اعداد — `age = 20`, `score = -5`
- **float**: اعشاریہ اعداد — `price = 99.99`, `pi = 3.14`
- **str**: متن — `name = "Ahmad"`, `city = 'Lahore'`
- **bool**: صرف دو قیمتیں — `True` یا `False`
- `type()` function کسی بھی variable کا type بتاتا ہے: `type(age)` → `<class 'int'>`

### 3.3 Dynamic Typing
- Python میں variable کا type پہلے سے declare نہیں کرنا پڑتا
- Python خود سمجھتا ہے کہ value کس type کی ہے
- ایک ہی variable کو بعد میں مختلف type کی value دی جا سکتی ہے
- C++ میں `int x = 5;` لکھنا ضروری ہے لیکن Python میں صرف `x = 5`
- یہ سہولت Python کو beginners کے لیے آسان بناتی ہے

### 3.4 Constants اور Naming Conventions
- Python میں باضابطہ constant نہیں ہوتا لیکن convention یہ ہے کہ بڑے حروف استعمال ہوں
- مثال: `MAX_SCORE = 100`, `PI = 3.14159`
- Variable names meaningful رکھیں: `x` کی جگہ `student_age` بہتر ہے
- snake_case استعمال کریں: `first_name`, `total_marks`
- Keywords variable name نہیں بن سکتے: `if`, `for`, `while`, `return` وغیرہ

---

## Topic 4: Operators

### 4.1 Arithmetic Operators
- `+` جمع: `5 + 3 = 8`
- `-` تفریق: `10 - 4 = 6`
- `*` ضرب: `3 * 4 = 12`
- `/` تقسیم (ہمیشہ float دیتا ہے): `7 / 2 = 3.5`
- `//` floor division (پورا عدد): `7 // 2 = 3`
- `%` باقی: `7 % 2 = 1`
- `**` power: `2 ** 3 = 8`

### 4.2 Comparison Operators
- یہ دو values کا موازنہ کرتے ہیں اور نتیجہ True یا False ہوتا ہے
- `==` برابر: `5 == 5` → `True`
- `!=` برابر نہیں: `5 != 3` → `True`
- `>` بڑا: `10 > 5` → `True`
- `<` چھوٹا: `3 < 2` → `False`
- `>=` بڑا یا برابر، `<=` چھوٹا یا برابر

### 4.3 Logical Operators
- `and`: دونوں شرطیں True ہوں تو True: `True and False` → `False`
- `or`: کوئی ایک شرط True ہو تو True: `True or False` → `True`
- `not`: True کو False اور False کو True کرتا ہے: `not True` → `False`
- مثال: `age >= 18 and has_id == True` — دونوں شرطیں پوری ہوں

### 4.4 Assignment Operators
- `=` basic assignment: `x = 10`
- `+=` جمع کر کے رکھے: `x += 5` مطلب `x = x + 5`
- `-=` تفریق کر کے رکھے: `x -= 3`
- `*=` ضرب کر کے رکھے: `x *= 2`
- `/=` تقسیم کر کے رکھے: `x /= 4`

### 4.5 Operator Precedence
- پہلے `**`، پھر `* / // %`، پھر `+ -`
- `2 + 3 * 4 = 14` نہ کہ 20 کیونکہ ضرب پہلے ہوتی ہے
- قوسین سے ترتیب بدلیں: `(2 + 3) * 4 = 20`

---

## Topic 5: User Input اور Output

### 5.1 print() Function
- `print("Hello")` — text screen پر دکھاتا ہے
- Multiple values: `print("Name:", name, "Age:", age)`
- `sep` parameter: `print("a", "b", "c", sep="-")` → `a-b-c`
- `end` parameter: `print("Hello", end=" ")` — نئی line نہیں آتی
- `print()` بغیر کسی argument کے خالی line print کرتا ہے

### 5.2 input() Function
- `name = input("اپنا نام لکھیں: ")` — صارف سے input لیتا ہے
- input() ہمیشہ string return کرتا ہے چاہے صارف عدد لکھے
- اعداد کے لیے conversion ضروری: `age = int(input("عمر لکھیں: "))`
- Float کے لیے: `price = float(input("قیمت لکھیں: "))`

### 5.3 Type Conversion
- `int("25")` → `25` — string کو integer میں بدلتا ہے
- `float("3.14")` → `3.14`
- `str(100)` → `"100"` — integer کو string میں بدلتا ہے
- غلط conversion error دیتا ہے: `int("hello")` → `ValueError`
- input() کے ساتھ ہمیشہ type conversion کریں جب numbers کام چاہیے ہو

### 5.4 f-Strings
- Variables کو directly string میں ڈالنے کا طریقہ
- `f"میرا نام {name} ہے اور عمر {age} ہے"`
- اعشاریہ format: `f"قیمت: {price:.2f}"` — 2 decimal places
- f-strings Python 3.6 سے آئے اور سب سے آسان formatting طریقہ ہیں

---

## Topic 6: Conditional Statements

### 6.1 Conditional Logic کیا ہے؟
- پروگرام کو مختلف حالات میں مختلف کام کرنا ہوتا ہے
- جیسے: اگر نمبر 50 سے زیادہ ہیں تو Pass، ورنہ Fail
- Python میں یہ if، elif اور else سے کیا جاتا ہے
- Indentation بہت ضروری ہے — if block کے اندر کا code 4 spaces indent ہونا چاہیے

### 6.2 if اور else
```python
marks = int(input("نمبر لکھیں: "))
if marks >= 50:
    print("پاس")
else:
    print("فیل")
```
- if کے بعد condition آتی ہے پھر colon `:`
- else بغیر condition کے ہوتا ہے — if غلط ہو تو else چلتا ہے

### 6.3 elif — Multiple Conditions
```python
if marks >= 80:
    print("A گریڈ")
elif marks >= 60:
    print("B گریڈ")
elif marks >= 50:
    print("C گریڈ")
else:
    print("فیل")
```
- elif مطلب "else if" — پہلی شرط غلط ہو تو اگلی چیک ہوتی ہے
- جتنی elif چاہیں لکھ سکتے ہیں

### 6.4 Nested if
- if کے اندر دوسرا if لکھنا nested if کہلاتا ہے
- مثال: پہلے چیک کریں student enrolled ہے، پھر check کریں pass ہوا یا نہیں
- زیادہ nesting سے بچیں — code پڑھنا مشکل ہو جاتا ہے

### 6.5 Conditions کا Flowchart
- if-elif-else کو flowchart سے سمجھیں: diamond shape decision، arrow down
- ہر diamond سے دو راستے نکلتے ہیں: True اور False
- یہ visualize کرنے سے logic سمجھنا آسان ہو جاتا ہے

---

## Topic 7: Loops — for اور while

### 7.1 Loop کیوں ضروری ہے؟
- ایک ہی کام بار بار کرنا پڑے تو loop استعمال ہوتا ہے
- بغیر loop 100 بار print کرنے کے لیے 100 lines لکھنی پڑتیں
- Loop سے صرف چند lines میں یہ کام ہو جاتا ہے

### 7.2 for Loop
```python
for i in range(5):
    print(i)   # 0 1 2 3 4
```
- `range(5)` — 0 سے 4 تک اعداد دیتا ہے
- `range(1, 6)` — 1 سے 5 تک
- `range(1, 10, 2)` — 1، 3، 5، 7، 9 (2 کا step)
- List پر loop: `for name in names:` ہر name کے لیے چلے گا

### 7.3 while Loop
```python
count = 1
while count <= 5:
    print(count)
    count += 1
```
- جب تک condition True ہو loop چلتا رہتا ہے
- count += 1 ضروری ہے ورنہ infinite loop بن جاتا ہے
- for loop گننے کے لیے، while loop condition پر چیک کے لیے بہتر ہے

### 7.4 for بمقابلہ while
- for: جب معلوم ہو کتنی بار چلانا ہے — `for i in range(10)`
- while: جب condition پر منحصر ہو — `while user_input != "exit"`
- ایک ہی مسئلہ دونوں سے حل ہو سکتا ہے لیکن موقع کے مطابق چنیں

### 7.5 break اور continue
- `break`: loop فوراً ختم کر دیتا ہے
- `continue`: موجودہ iteration چھوڑ کر اگلی پر جاتا ہے
```python
for i in range(10):
    if i == 5:
        break      # 5 پر رک جائے گا
    print(i)
```

### 7.6 Nested Loops
- Loop کے اندر loop — مثلاً multiplication table
```python
for i in range(1, 4):
    for j in range(1, 4):
        print(i * j, end="  ")
    print()
```
- Outer loop ہر بار چلتا ہے تو inner loop مکمل ہوتا ہے

---

## Topic 8: Functions

### 8.1 Function کیا ہے؟
- Function code کا ایک نام والا block ہے جو بار بار استعمال ہو سکتا ہے
- ایک بار لکھیں، جتنی بار چاہیں call کریں
- Functions code کو منظم اور readable بناتے ہیں
- `def` keyword سے function بناتے ہیں

### 8.2 Function Define اور Call کرنا
```python
def greet():
    print("السلام علیکم!")

greet()   # function call
greet()   # دوبارہ call
```
- `def` پھر نام پھر `():` پھر indented code
- Call کرنے کے لیے صرف نام لکھیں + قوسین

### 8.3 Parameters اور Arguments
```python
def greet(name):
    print(f"السلام علیکم {name}!")

greet("Ahmad")
greet("Sara")
```
- Parameter: function definition میں variable کا نام
- Argument: function call میں دی جانے والی actual value
- Multiple parameters: `def add(a, b):`

### 8.4 Return Values
```python
def add(a, b):
    return a + b

result = add(5, 3)
print(result)   # 8
```
- `return` function سے value واپس بھیجتا ہے
- Return کے بعد function بند ہو جاتا ہے
- Return نہ لکھیں تو function `None` return کرتا ہے

### 8.5 Default Parameters
```python
def greet(name, language="Urdu"):
    print(f"{name} {language} میں سیکھ رہا ہے")

greet("Ahmad")          # Urdu default
greet("Sara", "Python") # override
```

### 8.6 Scope — Local اور Global
- Local variable: function کے اندر بنا — باہر accessible نہیں
- Global variable: function سے باہر بنا — ہر جگہ accessible
- Function کے اندر global variable read کر سکتے ہیں لیکن بدلنے کے لیے `global` keyword چاہیے

---

## Topic 9: Lists اور Tuples

### 9.1 List کیا ہے؟
- List values کا ordered collection ہے جو قابل ترمیم ہے
- `students = ["Ahmad", "Sara", "Ali"]`
- Square brackets `[]` میں comma سے الگ values
- Indexed: پہلی value index 0 پر، دوسری 1 پر
- ایک list میں مختلف types بھی رکھ سکتے ہیں

### 9.2 List Access کرنا
- `students[0]` → `"Ahmad"`
- `students[-1]` → آخری element `"Ali"`
- Slicing: `students[0:2]` → `["Ahmad", "Sara"]`
- Length: `len(students)` → `3`

### 9.3 List Methods
- `students.append("Zara")` — آخر میں add کرے
- `students.remove("Ali")` — element ہٹائے
- `students.pop()` — آخری element نکالے اور return کرے
- `students.sort()` — ترتیب لگائے
- `students.reverse()` — الٹ کرے
- `"Ahmad" in students` → `True` — موجودگی چیک کرے

### 9.4 List پر Loop
```python
for student in students:
    print(student)
```
- List comprehension: `squares = [x**2 for x in range(5)]`

### 9.5 Tuple کیا ہے؟
- Tuple بھی list جیسا ہے لیکن immutable — بنانے کے بعد تبدیل نہیں ہو سکتا
- `coordinates = (10, 20)`
- Round brackets `()` استعمال ہوتے ہیں
- Fixed data کے لیے tuple بہتر ہے جیسے دن کے نام، coordinates

### 9.6 List بمقابلہ Tuple
| List | Tuple |
|------|-------|
| Mutable | Immutable |
| `[]` | `()` |
| Slower | Faster |
| Dynamic data | Fixed data |

---

## Topic 10: Dictionaries اور Sets

### 10.1 Dictionary کیا ہے؟
- Dictionary key-value pairs کا collection ہے
- `student = {"name": "Ahmad", "age": 20, "marks": 85}`
- Curly braces `{}` میں key: value کی صورت
- Key unique ہوتی ہے، value کچھ بھی ہو سکتی ہے
- Real dictionary جیسا: word (key) اور meaning (value)

### 10.2 Dictionary Access اور Modification
- Access: `student["name"]` → `"Ahmad"`
- Safe access: `student.get("grade", "N/A")` — key نہ ہو تو default دے
- Add/Update: `student["grade"] = "A"`
- Delete: `del student["age"]`

### 10.3 Dictionary Methods
- `student.keys()` → تمام keys
- `student.values()` → تمام values
- `student.items()` → key-value pairs as tuples
- Loop: `for key, value in student.items(): print(key, value)`

### 10.4 Set کیا ہے؟
- Set unique values کا unordered collection ہے
- `fruits = {"apple", "mango", "apple"}` → `{"apple", "mango"}` (duplicate ہٹ جاتا ہے)
- Curly braces لیکن key-value نہیں، صرف values
- تیز membership check: `"apple" in fruits`
- Mathematical operations: `union()`, `intersection()`, `difference()`

### 10.5 کونسا Collection کب استعمال کریں؟
- List: ordered, changeable, duplicates allowed → marks کی list
- Tuple: ordered, fixed → coordinates, RGB colors
- Dictionary: key سے access → student record
- Set: unique values → unique visitors, enrolled courses

---

## Topic 11: Strings

### 11.1 String کیا ہے؟
- String characters کی ایک sequence ہے
- `name = "Ahmad"` — یہ 5 characters کی string ہے
- Single `'` یا double `"` quotes دونوں استعمال ہو سکتے ہیں
- Strings immutable ہیں — بنانے کے بعد individual character نہیں بدل سکتے
- Multi-line string کے لیے triple quotes: `"""..."""`

### 11.2 String Indexing اور Slicing
- `name[0]` → `"A"` — index 0 سے شروع
- `name[-1]` → `"d"` — آخری character
- `name[1:4]` → `"hma"` — index 1 سے 3 تک
- `name[:3]` → `"Ahm"` — شروع سے 3 تک
- `name[::2]` → `"Aha"` — ہر دوسرا character

### 11.3 Common String Methods
- `name.upper()` → `"AHMAD"`
- `name.lower()` → `"ahmad"`
- `name.strip()` → spaces ہٹائے شروع اور آخر سے
- `name.replace("A", "O")` → `"Ohmod"`
- `name.split(",")` → comma پر تقسیم کرے، list دے
- `name.find("h")` → 1 — index بتائے، نہ ملے تو -1
- `len(name)` → 5

### 11.4 String Formatting
- f-string: `f"نام: {name}, عمر: {age}"`
- `.format()`: `"نام: {}, عمر: {}".format(name, age)`
- f-string زیادہ آسان اور readable ہے
- اعشاریہ: `f"{price:.2f}"` — 2 decimal places

---

## Topic 12: File Handling

### 12.1 Files کیوں ضروری ہیں؟
- Program بند ہو جائے تو memory کا سارا data ضائع ہو جاتا ہے
- Files میں data permanently save ہوتا ہے
- Input data file سے پڑھ سکتے ہیں، output file میں save کر سکتے ہیں
- Python میں built-in `open()` function سے files کھولتے ہیں

### 12.2 File لکھنا
```python
with open("data.txt", "w") as file:
    file.write("Ahmad\n")
    file.write("85 marks\n")
```
- `"w"` mode: نئی فائل بنائے یا پرانی overwrite کرے
- `with` statement: automatically file بند کر دیتا ہے
- `\n` نئی line کے لیے

### 12.3 File پڑھنا
```python
with open("data.txt", "r") as file:
    content = file.read()
    print(content)
```
- `read()`: پوری فائل ایک string میں
- `readline()`: ایک line پڑھے
- `readlines()`: سب lines بطور list

### 12.4 File Append Mode
```python
with open("data.txt", "a") as file:
    file.write("نئی line\n")
```
- `"a"` mode: موجودہ content رکھے اور آخر میں add کرے
- `"w"` mode سے فرق: `"w"` سب مٹا کر نئے سرے سے لکھتا ہے

---

## Topic 13: Error Handling

### 13.1 Errors کی اقسام
- **Syntax Error**: code کا grammar غلط — program چلتا ہی نہیں
  - مثال: `print "Hello"` (Python 3 میں قوسین ضروری)
- **Runtime Error**: program چلتے وقت مسئلہ
  - مثال: `int("abc")` → ValueError
  - مثال: `10 / 0` → ZeroDivisionError
- **Logic Error**: program چلتا ہے لیکن نتیجہ غلط آتا ہے

### 13.2 try اور except
```python
try:
    number = int(input("عدد لکھیں: "))
    result = 10 / number
    print(result)
except ValueError:
    print("غلط input — عدد لکھیں")
except ZeroDivisionError:
    print("صفر سے تقسیم نہیں ہو سکتی")
```
- `try` block میں وہ code جو error دے سکتا ہے
- `except` block میں error handle کرنے کا code

### 13.3 else اور finally
```python
try:
    result = int("25")
except ValueError:
    print("Error!")
else:
    print("کامیاب:", result)  # صرف تب چلے جب error نہ آئے
finally:
    print("یہ ہمیشہ چلتا ہے")  # error ہو یا نہ ہو
```

### 13.4 raise — خود Error اٹھانا
```python
age = int(input("عمر لکھیں: "))
if age < 0:
    raise ValueError("عمر منفی نہیں ہو سکتی")
```
- اپنی شرط پر error پھینکنا ممکن ہے
- User کو واضح پیغام ملتا ہے

---

## Topic 14: Object-Oriented Programming کا تعارف

### 14.1 OOP کیا ہے؟
- Programming کا ایک طریقہ جہاں code کو real-world objects کی طرح منظم کیا جاتا ہے
- Object-Oriented Programming مطلب: objects کے گرد programming
- Class: ایک blueprint یا قالب — جیسے گاڑی کا design
- Object: class سے بنا اصل چیز — جیسے آپ کی مخصوص گاڑی
- OOP code کو منظم، قابل استعمال اور سمجھنے میں آسان بناتا ہے

### 14.2 Class اور Object بنانا
```python
class Student:
    def __init__(self, name, marks):
        self.name = name
        self.marks = marks

    def get_grade(self):
        if self.marks >= 80:
            return "A"
        elif self.marks >= 60:
            return "B"
        return "C"

s1 = Student("Ahmad", 85)
print(s1.name)
print(s1.get_grade())
```

### 14.3 __init__ Constructor
- `__init__` وہ method ہے جو object بناتے وقت خود بخود چلتا ہے
- `self` اس مخصوص object کو refer کرتا ہے
- `self.name = name` مطلب اس object کی name property set کریں

### 14.4 Attributes اور Methods
- Attribute: object کی property — `self.name`, `self.marks`
- Method: object کا کام — `get_grade()`, `introduce()`
- Dot notation سے access: `s1.name`, `s1.get_grade()`

### 14.5 OOP بمقابلہ Procedural
- Procedural: سب کچھ functions میں — `get_grade(name, marks)`
- OOP: data اور functions ایک ساتھ class میں — `student.get_grade()`
- بڑے programs میں OOP زیادہ منظم اور manageable ہے

---

## Topic 15: بڑے پروگرام — مکمل کوڈ پریکٹس

### پروگرام 1: Student Grade Management System
```python
def get_grade(marks):
    if marks >= 80: return "A"
    elif marks >= 70: return "B"
    elif marks >= 60: return "C"
    elif marks >= 50: return "D"
    else: return "F"

students = []
n = int(input("کتنے طلباء: "))
for i in range(n):
    name = input(f"طالب علم {i+1} کا نام: ")
    marks = int(input(f"{name} کے نمبر: "))
    students.append({"name": name, "marks": marks, "grade": get_grade(marks)})

print("\n--- نتائج ---")
print(f"{'نام':<15} {'نمبر':<10} {'گریڈ'}")
print("-" * 35)
for s in students:
    print(f"{s['name']:<15} {s['marks']:<10} {s['grade']}")

with open("results.txt", "w") as f:
    for s in students:
        f.write(f"{s['name']}: {s['marks']} - Grade {s['grade']}\n")
print("\nنتائج results.txt میں محفوظ ہو گئے")
```

### پروگرام 2: Simple ATM Banking System
```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []

    def deposit(self, amount):
        if amount <= 0:
            print("رقم درست نہیں")
            return
        self.balance += amount
        self.history.append(f"جمع: {amount}")
        print(f"{amount} روپے جمع ہوئے۔ بقیہ: {self.balance}")

    def withdraw(self, amount):
        if amount <= 0:
            print("رقم درست نہیں")
        elif amount > self.balance:
            print("ناکافی رقم")
        else:
            self.balance -= amount
            self.history.append(f"نکاسی: {amount}")
            print(f"{amount} روپے نکلے۔ بقیہ: {self.balance}")

    def show_statement(self):
        print(f"\n--- {self.owner} کا بیان ---")
        for record in self.history:
            print(record)
        print(f"موجودہ بقیہ: {self.balance}")

account = BankAccount("Ahmad", 1000)
while True:
    print("\n1. جمع  2. نکاسی  3. بیان  4. خروج")
    choice = input("انتخاب: ")
    if choice == "1":
        account.deposit(int(input("رقم: ")))
    elif choice == "2":
        account.withdraw(int(input("رقم: ")))
    elif choice == "3":
        account.show_statement()
    elif choice == "4":
        print("خدا حافظ!")
        break
```

### پروگرام 3: Word Frequency Analyzer
```python
import string

def clean_word(word):
    return word.lower().strip(string.punctuation)

def analyze_text(text):
    words = text.split()
    frequency = {}
    for word in words:
        word = clean_word(word)
        if word:
            frequency[word] = frequency.get(word, 0) + 1
    return frequency

def top_words(frequency, n=5):
    sorted_words = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
    return sorted_words[:n]

print("متن لکھیں (Enter دو بار دبائیں):")
lines = []
while True:
    line = input()
    if line == "":
        break
    lines.append(line)

text = " ".join(lines)
freq = analyze_text(text)

print(f"\nکل منفرد الفاظ: {len(freq)}")
print("\nسب سے زیادہ استعمال شدہ الفاظ:")
for word, count in top_words(freq):
    print(f"  {word}: {count} بار")
```
