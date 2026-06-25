# Introduction to Programming Using C++ — Course Reference

---

## Course Settings

- **Course Name:** Introduction to Programming Using C++
- **Level:** Beginner
- **Language:** English
- **Duration:** 9 weeks
- **Creation Mode:** AI Generated

### AI Lecture Settings
- **Explanation Style:** Step-by-Step
- **Code Depth:** Heavy
- **Visual Preference:** Mixed
- **Audience:** General

---

## Topic Outlines

---

## Topic 1: Introduction to Programming and C++

### What is Programming?
A program is a set of instructions that tells a computer what to do. Computers only understand binary (0s and 1s), so programming languages like C++ act as a bridge between human thinking and machine execution. Every app, game, or website you use is the result of a program written by a programmer.

### Why C++?
C++ is one of the most powerful and widely-used programming languages in the world. It is used in game development (Unreal Engine), operating systems, embedded systems, competitive programming, and high-performance software. Learning C++ builds a strong foundation because it teaches you how memory works, how the CPU executes instructions, and how to think like a computer.

### Compiled vs Interpreted Languages
C++ is a compiled language. You write source code (.cpp file), the compiler translates it into machine code (.exe or binary), and then the CPU runs it directly. This makes C++ programs extremely fast. Interpreted languages like Python run line by line through an interpreter, which is slower but more flexible.

### Setting Up the Environment
- Install VS Code with the C/C++ extension and MinGW compiler (Windows), or use Code::Blocks which comes bundled with a compiler
- The compiler converts your .cpp file into an executable
- The linker connects your code with standard library functions
- The build process: write code → compile → link → run

### Structure of a C++ Program
Every C++ program has the same basic skeleton:
- `#include <iostream>` — tells the compiler to include the input/output library
- `using namespace std;` — lets you use cout and cin without the std:: prefix
- `int main()` — the entry point, execution always starts here
- `return 0;` — signals the program ended successfully

### Hello World Explained Line by Line
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```
- `cout` sends output to the screen
- `<<` is the insertion operator, it pushes data into cout
- `endl` ends the line and flushes the output buffer

### Types of Errors
- Syntax error — you broke a grammar rule (missing semicolon, mismatched brackets). The compiler catches this before running.
- Linker error — the compiler found your code but cannot find a function definition it needs.
- Runtime error — the program compiled fine but crashes while running (e.g., dividing by zero).
- Logic error — the program runs but gives the wrong answer. The hardest to find.

### Comments
Comments are notes in your code ignored by the compiler. Use them to explain what your code does.
```cpp
// This is a single-line comment

/* This is a
   multi-line comment */
```

### The Standard Library
The `#include` directive imports pre-written code. `<iostream>` gives you cout and cin. `<string>` gives you the string type. `<cmath>` gives you math functions like sqrt() and pow(). You will use these throughout the course.

---

## Topic 2: Variables, Data Types, and Input/Output

### What is a Variable?
A variable is a named location in memory that stores a value. When you declare `int age = 20;`, the computer reserves a small block of RAM, names it "age", and stores the number 20 there. Every variable has a name, a data type, and a value.

### Declaring and Initializing Variables
```cpp
int score = 100;       // integer
double price = 9.99;   // decimal number
char grade = 'A';      // single character
bool isActive = true;  // true or false
```
You can declare without initializing (`int x;`) but uninitialized variables contain garbage values — always initialize.

### Fundamental Data Types
| Type | Size | Range / Use |
|------|------|-------------|
| int | 4 bytes | Whole numbers: -2,147,483,648 to 2,147,483,647 |
| float | 4 bytes | Decimal numbers, ~7 digits of precision |
| double | 8 bytes | Decimal numbers, ~15 digits of precision (preferred) |
| char | 1 byte | Single character stored as ASCII value |
| bool | 1 byte | true (1) or false (0) |
| long long | 8 bytes | Very large whole numbers |

Use the `sizeof` operator to check the size of any type: `cout << sizeof(int);`

### Constants
A constant is a variable whose value cannot change after it is set.
```cpp
const double PI = 3.14159;
const int MAX_STUDENTS = 50;
```
Use constants for values that should never change. This prevents accidental modification and makes code easier to read.

### Naming Rules and Best Practices
- Must start with a letter or underscore, not a number
- Cannot use reserved keywords (int, for, while, etc.)
- Case-sensitive: `age` and `Age` are different variables
- Use camelCase for variables: `studentName`, `totalScore`
- Use ALL_CAPS for constants: `MAX_SIZE`
- Use descriptive names — `speed` is better than `s`

### Input and Output
```cpp
int age;
cout << "Enter your age: ";   // output to screen
cin >> age;                    // read input from keyboard
cout << "You are " << age << " years old." << endl;
```
- `cout <<` outputs to screen
- `cin >>` reads from keyboard
- You can chain multiple outputs: `cout << "Hello" << " " << "World";`

### Escape Sequences
| Sequence | Meaning |
|----------|---------|
| `\n` | New line |
| `\t` | Tab |
| `\\` | Backslash |
| `\"` | Double quote |
| `\'` | Single quote |

### The string Type
```cpp
#include <string>
string name = "Ali";
cout << "Hello, " << name << endl;
cout << "Length: " << name.length() << endl;
```
Strings store text. They are more powerful than char arrays and much easier to use.

### Type Casting
Converting one data type to another:
```cpp
int a = 5, b = 2;
double result = (double)a / b;  // explicit cast → 2.5
// without cast: 5/2 = 2 (integer division loses the decimal)
```
Implicit conversion happens automatically when assigning a smaller type to a larger type (int → double). Explicit conversion uses `(type)` syntax.

---

## Topic 3: Operators and Expressions

### Arithmetic Operators
```cpp
int a = 10, b = 3;
cout << a + b;   // 13 — addition
cout << a - b;   // 7  — subtraction
cout << a * b;   // 30 — multiplication
cout << a / b;   // 3  — integer division (decimal truncated)
cout << a % b;   // 1  — modulus (remainder)
```
Integer division truncates the decimal. `10 / 3 = 3`, not 3.33. To get 3.33, at least one operand must be a double: `10.0 / 3`.

### Modulus Operator (%)
Gives the remainder of division. Practical uses:
- Check if a number is even: `if (n % 2 == 0)`
- Extract last digit of a number: `n % 10`
- Wrap a value within a range: `index % arraySize`

### Assignment Operators
```cpp
int x = 10;
x += 5;   // x = x + 5  → 15
x -= 3;   // x = x - 3  → 12
x *= 2;   // x = x * 2  → 24
x /= 4;   // x = x / 4  → 6
x %= 4;   // x = x % 4  → 2
```

### Increment and Decrement
```cpp
int i = 5;
cout << i++;   // prints 5, then i becomes 6 (post-increment)
cout << ++i;   // i becomes 7 first, then prints 7 (pre-increment)
cout << i--;   // prints 7, then i becomes 6 (post-decrement)
```
Pre-increment (`++i`) increments first then uses the value. Post-increment (`i++`) uses the value first then increments.

### Relational Operators
Relational operators compare two values and return true or false:
```cpp
int a = 5, b = 10;
a == b   // false — equal to
a != b   // true  — not equal to
a < b    // true  — less than
a > b    // false — greater than
a <= b   // true  — less than or equal
a >= b   // false — greater than or equal
```

### Logical Operators
Used to combine multiple conditions:
```cpp
int age = 20;
bool hasID = true;

if (age >= 18 && hasID)     // AND — both must be true
if (age < 13 || age > 60)   // OR  — at least one must be true
if (!hasID)                  // NOT — reverses the condition
```

### Operator Precedence
Operators are evaluated in this order (high to low):
1. `()` — parentheses
2. `++`, `--`, `!` — unary
3. `*`, `/`, `%` — multiplication/division
4. `+`, `-` — addition/subtraction
5. `<`, `>`, `<=`, `>=` — relational
6. `==`, `!=` — equality
7. `&&` — logical AND
8. `||` — logical OR
9. `=`, `+=`, `-=` — assignment

Use parentheses to make order explicit and avoid bugs.

### Common Mistake: = vs ==
```cpp
int x = 5;
if (x = 10)   // BUG: assigns 10 to x, always true
if (x == 10)  // CORRECT: checks if x equals 10
```
This is one of the most common beginner mistakes. Always use `==` for comparison inside conditions.

### Bitwise Operators (Overview)
Operate on individual bits of integers. Useful in low-level programming:
- `&` AND, `|` OR, `^` XOR, `~` NOT, `<<` left shift, `>>` right shift
- Example: `5 & 3` → binary `101 & 011` → `001` → 1

---

## Topic 4: Control Flow — Conditionals

### What is Control Flow?
By default, a program runs line by line from top to bottom. Control flow lets you change that — skipping code, repeating it, or choosing between different paths based on conditions. Conditionals are the first tool for making decisions in code.

### The if Statement
```cpp
int score = 85;
if (score >= 50) {
    cout << "You passed!" << endl;
}
```
The code inside `{}` only runs if the condition is true. If false, it is skipped entirely.

### The if-else Statement
```cpp
int score = 40;
if (score >= 50) {
    cout << "Passed" << endl;
} else {
    cout << "Failed" << endl;
}
```
Exactly one block runs — either the if block or the else block, never both.

### The if-else if-else Ladder
```cpp
int score = 72;
if (score >= 90) {
    cout << "Grade: A" << endl;
} else if (score >= 80) {
    cout << "Grade: B" << endl;
} else if (score >= 70) {
    cout << "Grade: C" << endl;
} else {
    cout << "Grade: F" << endl;
}
```
C++ checks each condition from top to bottom and runs the first one that is true. Once a match is found, the rest are skipped.

### Nested if Statements
```cpp
int age = 20;
bool hasTicket = true;

if (age >= 18) {
    if (hasTicket) {
        cout << "Entry allowed" << endl;
    } else {
        cout << "No ticket" << endl;
    }
} else {
    cout << "Too young" << endl;
}
```
Use nested ifs when a second condition only makes sense if the first is already true. Avoid nesting too deeply — it makes code hard to read.

### The switch Statement
```cpp
int day = 3;
switch (day) {
    case 1: cout << "Monday"; break;
    case 2: cout << "Tuesday"; break;
    case 3: cout << "Wednesday"; break;
    default: cout << "Other day"; break;
}
```
- `break` exits the switch after a match. Without it, execution "falls through" to the next case.
- `default` runs when no case matches (like the final else).
- Use switch when comparing one variable against many fixed values.

### switch vs if-else
| switch | if-else |
|--------|---------|
| One variable, many exact values | Multiple conditions or ranges |
| Cleaner and faster for many cases | More flexible — works with any expression |
| Only works with int, char, enum | Works with any condition |

### The Ternary Operator
A compact one-line if-else:
```cpp
int age = 20;
string status = (age >= 18) ? "Adult" : "Minor";
cout << status;   // Adult
```
Format: `condition ? value_if_true : value_if_false`
Use it for simple assignments. Avoid it for complex logic — it reduces readability.

### Combining Conditions
```cpp
int age = 25;
double salary = 50000;

if (age >= 21 && salary >= 30000) {
    cout << "Loan approved" << endl;
}

if (age < 18 || age > 65) {
    cout << "Not eligible" << endl;
}
```

---

## Topic 5: Control Flow — Loops

### What is a Loop?
A loop lets you repeat a block of code multiple times without writing it repeatedly. Instead of writing `cout << i;` a hundred times, you write it once inside a loop that runs 100 times. Loops are one of the most used tools in programming.

### The for Loop
Best when you know exactly how many times to repeat:
```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";
}
// Output: 1 2 3 4 5
```
Three parts: `initialization` (runs once at start) → `condition` (checked before each iteration) → `update` (runs after each iteration). If the condition is false at the start, the loop body never runs.

### The while Loop
Best when you repeat based on a condition, not a fixed count:
```cpp
int i = 1;
while (i <= 5) {
    cout << i << " ";
    i++;
}
// Output: 1 2 3 4 5
```
The condition is checked before entering the loop. If it starts false, the body never runs.

### The do-while Loop
Guaranteed to run at least once — condition is checked after the body:
```cpp
int number;
do {
    cout << "Enter a positive number: ";
    cin >> number;
} while (number <= 0);
```
Use do-while when you must execute the body at least once before checking (e.g., input validation).

### Choosing the Right Loop
| Loop | When to use |
|------|-------------|
| for | Known number of iterations |
| while | Unknown iterations, condition checked first |
| do-while | Must run at least once (e.g., menu, validation) |

### Nested Loops
A loop inside a loop. The inner loop completes all its iterations for each single iteration of the outer loop:
```cpp
for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 3; j++) {
        cout << i << "," << j << "  ";
    }
    cout << endl;
}
```
Common use: printing patterns, working with 2D grids, generating multiplication tables.

### break and continue
```cpp
// break — exits the loop immediately
for (int i = 1; i <= 10; i++) {
    if (i == 5) break;
    cout << i << " ";   // prints: 1 2 3 4
}

// continue — skips the rest of this iteration, moves to next
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) continue;
    cout << i << " ";   // prints: 1 3 5 7 9
}
```

### Infinite Loops
A loop whose condition never becomes false runs forever and crashes your program:
```cpp
while (true) {     // infinite — use only with a break inside
    // ...
}

int i = 0;
while (i < 10) {   // BUG: i never changes → infinite loop
    cout << i;
}
```
Always make sure the loop variable changes in a way that eventually makes the condition false.

### Common Loop Patterns
```cpp
// Sum of numbers 1 to 100
int sum = 0;
for (int i = 1; i <= 100; i++) sum += i;

// Find maximum in a sequence
int max = INT_MIN;
for (int i = 0; i < n; i++)
    if (arr[i] > max) max = arr[i];

// Count how many times a condition is met
int count = 0;
for (int i = 1; i <= 100; i++)
    if (i % 3 == 0) count++;
```

---

## Topic 6: Functions

### What is a Function?
A function is a named, reusable block of code that performs a specific task. Instead of writing the same logic repeatedly, you write it once as a function and call it wherever needed. Functions make programs shorter, easier to read, and easier to fix.

### Function Syntax
```cpp
int add(int a, int b) {   // return type, name, parameters
    return a + b;          // body
}

int main() {
    int result = add(3, 5);   // calling the function
    cout << result;            // 8
}
```
- Return type — the data type the function sends back (`int`, `double`, `void`, etc.)
- Parameters — inputs the function receives (optional)
- Return value — the result sent back with `return`

### Function Declaration vs Definition
In C++, you must declare a function before you call it. You can do this with a prototype:
```cpp
int add(int a, int b);   // declaration (prototype) — tells compiler it exists

int main() {
    cout << add(3, 5);   // works because prototype was seen first
}

int add(int a, int b) {  // definition — actual implementation
    return a + b;
}
```

### Void Functions
A void function performs an action but does not return a value:
```cpp
void printWelcome(string name) {
    cout << "Welcome, " << name << "!" << endl;
}

int main() {
    printWelcome("Ali");   // no return value to capture
}
```

### Pass by Value
By default, C++ passes a copy of the variable to the function. Changes inside the function do NOT affect the original:
```cpp
void double_it(int x) {
    x = x * 2;   // changes the copy, not the original
}

int main() {
    int n = 5;
    double_it(n);
    cout << n;   // still 5
}
```

### Default Parameter Values
You can give parameters a default value used when the caller does not pass one:
```cpp
void greet(string name, string msg = "Hello") {
    cout << msg << ", " << name << endl;
}

greet("Ali");           // Hello, Ali
greet("Ali", "Hi");     // Hi, Ali
```

### Function Overloading
Multiple functions with the same name but different parameter types or counts:
```cpp
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }
int add(int a, int b, int c) { return a + b + c; }
```
C++ picks the right version based on the argument types at the call site.

### Scope: Local vs Global
```cpp
int globalVar = 100;   // accessible everywhere

void myFunction() {
    int localVar = 5;   // only accessible inside myFunction
    cout << globalVar;  // can access global
}

int main() {
    cout << globalVar;  // fine
    // cout << localVar; // ERROR: localVar doesn't exist here
}
```
Prefer local variables. Use global variables sparingly.

### The Call Stack
When a function is called, the CPU saves the current position, jumps to the function, executes it, then returns. This uses a memory region called the call stack. Deep or infinite recursion overflows the stack (stack overflow).

### Recursive Functions
A function that calls itself. Must have a base case to stop:
```cpp
int factorial(int n) {
    if (n == 0) return 1;          // base case
    return n * factorial(n - 1);   // recursive case
}

cout << factorial(5);   // 5*4*3*2*1 = 120
```

### Fibonacci with Recursion
```cpp
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
// fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(4)=3, fib(5)=5
```

---

## Topic 7: Arrays and Strings

### What is an Array?
An array stores multiple values of the same type under one name, accessed by index. Instead of declaring `int score1, score2, score3 ... score100`, you use one array.

### Declaring and Initializing Arrays
```cpp
int scores[5];                          // declares array of 5 ints (uninitialized)
int scores[5] = {90, 85, 78, 92, 88};  // declares and initializes
int scores[] = {90, 85, 78, 92, 88};   // size inferred automatically
```

### Accessing Elements
Arrays are zero-indexed — the first element is at index 0:
```cpp
cout << scores[0];   // 90 (first element)
cout << scores[4];   // 88 (fifth element)
scores[2] = 100;     // change third element to 100
```
Accessing `scores[5]` on a 5-element array is out-of-bounds — undefined behavior, often crashes the program.

### Iterating Over Arrays
```cpp
int scores[5] = {90, 85, 78, 92, 88};
int n = 5;

for (int i = 0; i < n; i++) {
    cout << scores[i] << " ";
}
```

### Passing Arrays to Functions
Arrays are always passed by reference (the function receives a pointer to the original):
```cpp
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++)
        cout << arr[i] << " ";
}

int main() {
    int nums[] = {1, 2, 3, 4, 5};
    printArray(nums, 5);
}
```

### Multi-Dimensional Arrays (2D)
A 2D array is like a table with rows and columns:
```cpp
int matrix[3][3] = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

cout << matrix[1][2];   // row 1, column 2 → 6

for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        cout << matrix[i][j] << " ";
    }
    cout << endl;
}
```

### Common Array Algorithms
```cpp
// Find minimum
int min = arr[0];
for (int i = 1; i < n; i++)
    if (arr[i] < min) min = arr[i];

// Sum all elements
int sum = 0;
for (int i = 0; i < n; i++) sum += arr[i];

// Linear search
int target = 78;
for (int i = 0; i < n; i++) {
    if (arr[i] == target) { cout << "Found at index " << i; break; }
}

// Reverse an array
for (int i = 0; i < n / 2; i++)
    swap(arr[i], arr[n - 1 - i]);
```

### C-Style Strings (char arrays)
```cpp
char name[6] = {'A', 'l', 'i', '\0'};   // null terminator marks end
char name[] = "Ali";                      // shorthand — compiler adds \0
cout << name;   // Ali
```
The `\0` character (null terminator) tells C++ where the string ends. Without it, reading the string goes past its memory into garbage values.

### The string Class (Preferred)
```cpp
#include <string>
string name = "Ali Hassan";

cout << name.length();           // 10
cout << name.substr(4, 6);       // Hassan (start at 4, take 6 chars)
cout << name.find("Hassan");     // 4 (index where it starts)

name.replace(4, 6, "Ahmed");     // "Ali Ahmed"
name.append(" Jr.");             // "Ali Ahmed Jr."

string s1 = "Hello", s2 = "World";
string s3 = s1 + " " + s2;      // concatenation → "Hello World"
```

### C-Style vs std::string
| Feature | char array | std::string |
|---------|------------|-------------|
| Size | Fixed at declaration | Dynamic |
| Concatenation | strcpy/strcat functions | + operator |
| Comparison | strcmp function | == operator |
| Safety | Prone to buffer overflow | Safe |
Use `std::string` in almost all cases. C-style strings are shown for context only.

---

## Topic 8: Pointers and Memory

### What is a Pointer?
Every variable is stored at a memory address. A pointer is a variable that stores a memory address instead of a regular value. Pointers give you direct access to memory — this is what makes C++ powerful and fast compared to higher-level languages.

### Declaring and Using Pointers
```cpp
int age = 25;
int* ptr = &age;   // ptr stores the address of age

cout << age;    // 25         — the value
cout << &age;   // 0x61ff08   — the address of age
cout << ptr;    // 0x61ff08   — address stored in ptr
cout << *ptr;   // 25         — dereference: value at that address
```
- `&` (address-of operator) — gives the memory address of a variable
- `*` (dereference operator) — accesses the value at the address a pointer holds

### Modifying Values Through Pointers
```cpp
int x = 10;
int* p = &x;
*p = 50;          // changes x through the pointer
cout << x;        // 50
```

### Pointer Arithmetic
```cpp
int arr[] = {10, 20, 30, 40};
int* p = arr;        // points to first element

cout << *p;          // 10
cout << *(p + 1);    // 20 — moves one int forward in memory
cout << *(p + 2);    // 30
p++;                 // p now points to arr[1]
```
Adding 1 to a pointer moves it forward by the size of the type (4 bytes for int), not just 1 byte.

### Null Pointers
A pointer that does not point to any valid address:
```cpp
int* ptr = nullptr;   // modern C++ — preferred
int* ptr = NULL;      // older style

if (ptr != nullptr) {
    cout << *ptr;     // safe — always check before dereferencing
}
```
Dereferencing a null pointer crashes your program. Always initialize pointers to nullptr if not yet assigned.

### Pointers and Arrays
Array names are pointers to the first element:
```cpp
int arr[] = {10, 20, 30};
cout << arr;       // address of arr[0]
cout << *arr;      // 10 (dereferences arr[0])
cout << arr[1];    // 20 — same as *(arr + 1)
```

### Passing Pointers to Functions (Pass by Reference)
Allows a function to modify the original variable:
```cpp
void doubleValue(int* p) {
    *p = *p * 2;   // modifies the original through the pointer
}

int main() {
    int n = 5;
    doubleValue(&n);
    cout << n;     // 10 — original was modified
}
```

### References (Cleaner Alternative to Pointers)
A reference is an alias for an existing variable — simpler syntax than pointers:
```cpp
int age = 25;
int& ref = age;    // ref is another name for age

ref = 30;
cout << age;       // 30 — same variable
```
Passing by reference in functions:
```cpp
void increment(int& x) {
    x++;    // modifies the original directly
}
```

| Feature | Pointer | Reference |
|---------|---------|-----------|
| Syntax | `int* p = &x` | `int& r = x` |
| Can be null | Yes | No |
| Can be reassigned | Yes | No (fixed to one variable) |
| Needs dereferencing | Yes (`*p`) | No (use directly) |

### Dynamic Memory Allocation
Allocate memory at runtime using `new`:
```cpp
int* p = new int;      // allocates one int on the heap
*p = 42;
cout << *p;            // 42
delete p;              // MUST free when done
p = nullptr;           // good practice after delete

int* arr = new int[5]; // allocates array of 5 ints
arr[0] = 10;
delete[] arr;          // use delete[] for arrays
```

### Memory Leaks
A memory leak happens when you allocate memory with `new` but never call `delete`. The memory stays reserved until the program ends, slowly consuming RAM:
```cpp
void leaky() {
    int* p = new int(100);
    // forgot delete p; — memory leaked every time leaky() is called
}
```
Always pair every `new` with a `delete` and every `new[]` with a `delete[]`.

### Common Pointer Mistakes
```cpp
// 1. Uninitialized pointer — points to random garbage address
int* p;
*p = 5;   // CRASH — undefined behavior

// 2. Dangling pointer — points to memory already freed
int* p = new int(10);
delete p;
cout << *p;   // CRASH — memory was freed

// 3. Double delete
delete p;
delete p;   // CRASH — cannot free the same memory twice
```

---

## Topic 9: Introduction to Object-Oriented Programming (OOP)

### What is OOP and Why Was It Introduced?
As programs grew larger, procedural code (functions + variables) became hard to manage. OOP organizes code around objects — self-contained units that bundle data and the functions that operate on that data together. Real-world entities (a student, a car, a bank account) map naturally to objects. OOP makes programs easier to build, maintain, and extend.

### The Four Pillars of OOP
- **Encapsulation** — bundling data and functions together, hiding internal details
- **Abstraction** — exposing only what is necessary, hiding complexity
- **Inheritance** — a new class can inherit properties and behavior from an existing class
- **Polymorphism** — the same function name behaves differently based on the object (covered in advanced OOP)

### Defining a Class
```cpp
class Student {
public:
    string name;
    int age;
    double gpa;

    void displayInfo() {
        cout << name << " | Age: " << age << " | GPA: " << gpa << endl;
    }
};
```
A class is a blueprint. It defines what data (attributes) and actions (methods) objects of this type will have. No memory is used until you create an object from it.

### Creating Objects and Accessing Members
```cpp
int main() {
    Student s1;           // create an object
    s1.name = "Ali";      // set attributes using dot operator
    s1.age = 20;
    s1.gpa = 3.8;
    s1.displayInfo();     // call method
}
```

### Access Specifiers
```cpp
class BankAccount {
private:
    double balance;        // only accessible inside the class

public:
    string ownerName;      // accessible from anywhere

protected:
    int accountNumber;     // accessible in class and derived classes
};
```
- `private` — hidden from outside. Only the class itself can access it. (Best for sensitive data)
- `public` — accessible from anywhere
- `protected` — accessible in the class and its child classes

### Constructors
A constructor is a special function that runs automatically when an object is created. It has the same name as the class and no return type:
```cpp
class Student {
public:
    string name;
    int age;

    Student() {                          // default constructor
        name = "Unknown";
        age = 0;
    }

    Student(string n, int a) {           // parameterized constructor
        name = n;
        age = a;
    }
};

int main() {
    Student s1;                   // calls default constructor
    Student s2("Ali", 20);        // calls parameterized constructor
    cout << s2.name;              // Ali
}
```

### Destructors
Called automatically when an object goes out of scope or is deleted. Used to release resources:
```cpp
class Student {
public:
    ~Student() {
        cout << "Student object destroyed" << endl;
    }
};
```

### The this Pointer
Inside any member function, `this` is a pointer to the current object. Useful when a parameter name matches a member variable name:
```cpp
class Student {
public:
    string name;

    Student(string name) {
        this->name = name;   // this->name = member, name = parameter
    }
};
```

### Getters and Setters (Encapsulation in Practice)
Keep data private, provide controlled access through public functions:
```cpp
class Student {
private:
    double gpa;

public:
    void setGpa(double g) {
        if (g >= 0.0 && g <= 4.0) gpa = g;   // validate before setting
    }

    double getGpa() {
        return gpa;
    }
};

int main() {
    Student s;
    s.setGpa(3.5);
    cout << s.getGpa();   // 3.5
}
```

### Simple Inheritance
A derived class inherits all public/protected members of a base class:
```cpp
class Animal {
public:
    string name;

    void eat() {
        cout << name << " is eating." << endl;
    }
};

class Dog : public Animal {   // Dog inherits from Animal
public:
    void bark() {
        cout << name << " says: Woof!" << endl;
    }
};

int main() {
    Dog d;
    d.name = "Rex";
    d.eat();    // inherited from Animal
    d.bark();   // Dog's own method
}
```

### Complete Example: Student Class
```cpp
class Student {
private:
    string name;
    int age;
    double gpa;

public:
    Student(string n, int a, double g) : name(n), age(a), gpa(g) {}

    void displayInfo() {
        cout << "Name: " << name << endl;
        cout << "Age:  " << age << endl;
        cout << "GPA:  " << gpa << endl;
    }

    string getGrade() {
        if (gpa >= 3.7) return "A";
        if (gpa >= 3.0) return "B";
        if (gpa >= 2.0) return "C";
        return "F";
    }
};

int main() {
    Student s("Ali", 20, 3.8);
    s.displayInfo();
    cout << "Grade: " << s.getGrade() << endl;
}
```

### class vs struct in C++
The only real difference in C++ is the default access:
- `class` — members are private by default
- `struct` — members are public by default

In practice: use `struct` for simple data containers with no behavior, use `class` for full objects with methods and encapsulation.
