# Introduction to Programming Using C++ — Complete Course Content

## Course Description

Master the fundamentals of programming using C++, one of the most powerful
and industry-relevant languages in computer science. Built for absolute
beginners, this course takes you from zero coding knowledge to writing
real, working programs with confidence. Every topic is explained clearly
with practical examples, live coding demonstrations, and exercises that
reinforce your understanding at every step.

What you will learn:
- How computers work and how programs are executed
- Setting up your C++ development environment (VS Code / Code::Blocks)
- Variables, data types, and constants
- Arithmetic, relational, and logical operators
- User input and output using cin and cout
- Conditional statements: if, else if, else, and switch
- Loops: for, while, and do-while with real use cases
- Functions: declaration, definition, parameters, return values, and scope
- Arrays and multi-dimensional arrays
- Strings and common string operations
- Pointers and memory addresses explained simply
- Introduction to Object-Oriented Programming: classes, objects, constructors
- Basic file handling and error understanding
- Debugging techniques and reading compiler errors

Who this course is for:
- Complete beginners with no programming experience
- Students studying computer science or software engineering
- Anyone who wants a strong programming foundation before moving to advanced topics

By the end of this course you will be able to:
- Write, compile, and run C++ programs from scratch
- Break down problems and translate them into working code
- Understand how memory and variables work under the hood
- Build a solid base to continue into data structures, algorithms, or any other language

---

## Topic 1: Introduction to Programming and C++

### 1.1 What is Programming?
- A computer program is a set of instructions given to a computer to perform a specific task
- A computer follows instructions step by step from top to bottom in sequence
- The programmer's role: writing, testing, and fixing those instructions
- Hardware: physical parts of a computer — CPU, RAM, keyboard, monitor
- Software: programs and data that run on hardware

### 1.2 Types of Programming Languages
- Machine language: binary code (0s and 1s) the CPU understands directly — not human-readable
- Assembly language: short codes like MOV, ADD that map directly to machine instructions
- High-level languages: English-like syntax — Python, Java, C# — easier to write and read
- Middle-level languages: combine high-level readability with low-level control — C and C++
- Compiled languages: entire source code translated to machine code before running — C, C++, Go
- Interpreted languages: translated and run line by line at runtime — Python, JavaScript
- Compiled programs are faster; interpreted programs are more flexible

### 1.3 Introduction to C++
- C++ was developed by Bjarne Stroustrup at Bell Labs starting in 1979
- Originally called "C with Classes", renamed to C++ in 1983
- The ++ comes from the increment operator — meaning an improved version of C
- C++ is a middle-level language: supports both high-level OOP and low-level memory control
- Used in: game engines (Unreal Engine), operating systems, embedded systems, competitive programming
- C++ is mostly backward compatible with C — valid C programs often compile as C++
- C++ adds: object-oriented programming, templates, exceptions, and the standard library
- Major standards: C++98 (first standardized), C++11 (auto, nullptr, lambda), C++17 (further improvements)

---

## Topic 2: Setting Up the C++ Development Environment

### 2.1 What is a Compiler?
- A compiler reads your source code (.cpp file) and translates it into machine code the CPU can run
- The translation happens all at once before the program runs — unlike an interpreter (Python) which runs line by line
- If the code has syntax errors, the compiler reports them with line numbers and produces no output
- If there are no errors, the compiler produces an executable file (.exe on Windows)
- The GNU C++ compiler (g++) is free and included with MinGW on Windows

### 2.2 What is an IDE?
- An IDE (Integrated Development Environment) combines everything a programmer needs in one place
- It includes: a code editor with syntax highlighting and auto-complete, a built-in compiler, a debugger, and a file manager
- Instead of using separate tools, you write, compile, and run code all from within the IDE
- Popular IDEs: Visual Studio, VS Code, Code::Blocks, Dev-C++, CLion

### 2.3 Installing Visual Studio (Recommended for Beginners)
- Download Visual Studio Community (completely free for students) from visualstudio.microsoft.com
- Run the installer and select the workload "Desktop development with C++"
- Click Install — this automatically sets up the MSVC compiler, debugger, and all required C++ tools
- No separate compiler download or PATH configuration needed — everything is set up automatically
- What is included: MSVC compiler, IntelliSense (auto-complete + error highlighting), built-in debugger, Solution Explorer

### 2.4 Creating and Running Your First C++ Project
- Open Visual Studio → click "Create a new project"
- Select "Console App" under C++ → click Next
- Give the project a name, choose a save location, click Create
- Visual Studio opens a ready-to-use main.cpp file with a basic Hello World program
- Press F5 to compile and run with the debugger — a console window shows the output
- Press Ctrl+F5 to run without the debugger (console stays open after the program finishes)

### 2.5 Structure of a C++ Program
- `#include <iostream>`: tells the preprocessor to include input/output functions
- `using namespace std;`: avoids writing `std::` before every standard library function
- `int main()`: every C++ program must have exactly one main() — execution starts here
- `{` and `}`: define the beginning and end of a code block — every opening brace must match a closing one
- Every statement ends with a semicolon `;` — missing semicolon is the most common beginner error
- `return 0;`: signals to the OS that the program ended successfully
- C++ is case-sensitive: `Main` is not `main`, `Cout` is not `cout`
- Indentation is ignored by the compiler but essential for readable code

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
```

### 2.6 Steps to Write and Run Any C++ Program
- Step 1: Write source code in a .cpp file
- Step 2: Compiler reads the file and checks for syntax errors
- Step 3: If no errors, compiler produces an object file (.o) with machine code
- Step 4: Linker combines the object file with library code to produce the final executable (.exe)
- Step 5: Run the executable — output appears in the terminal or console

### 2.7 Types of Errors
- Syntax errors: violations of C++ grammar rules — caught by the compiler before the program runs
- Runtime errors: occur while the program is running — dividing by zero, accessing invalid memory
- Logic errors: program compiles and runs but produces wrong results due to a reasoning mistake

---

## Topic 3: Variables, Data Types, and Constants

### 2.1 What is a Variable?
- A variable is a named storage location in memory that holds a value
- Think of it as a labeled box: the label is the name, the content is the value
- In C++ you must declare the type before using a variable: `int age = 20;`
- The type tells the compiler how much memory to reserve and how to interpret the bits
- Variable names: letters, digits, underscore; cannot start with a digit; no spaces; case-sensitive

### 2.2 Fundamental Data Types
- `int`: whole numbers, 4 bytes — `int score = 95;`
- `float`: decimal numbers, 4 bytes, ~7 significant digits — `float price = 9.99f;`
- `double`: decimal numbers, 8 bytes, ~15 significant digits — `double pi = 3.14159265;`
- `char`: single character, 1 byte — `char grade = 'A';`
- `bool`: true or false, 1 byte — `bool passed = true;`
- `string`: text (from `<string>` header) — `string name = "Ahmad";`

### 2.3 Constants
- `const int MAX = 100;` — value cannot change after initialization
- `#define PI 3.14159` — preprocessor replaces PI with 3.14159 throughout the code
- `const` is preferred over `#define` because it has a type and respects scope
- Convention: write constant names in UPPER_CASE

### 2.4 Type Sizes and Conversion
- `sizeof(int)` returns how many bytes that type uses on the current system
- Implicit conversion: `int x = 5; double d = x;` — automatically widened
- Explicit cast: `double d = 9.99; int i = (int)d;` → `i = 9` (decimal truncated)
- Integer overflow: if an int exceeds its range, it wraps around silently — be aware

### 2.5 Memory Model
- Every variable occupies a specific address in RAM
- `int x = 5;` reserves 4 bytes and stores the value 5 at that address
- The address can be retrieved with the address-of operator `&x`
- Understanding this prepares you for pointers later

---

## Topic 4: Operators in C++

### 3.1 Arithmetic Operators
- `+` addition: `5 + 3 = 8`
- `-` subtraction: `10 - 4 = 6`
- `*` multiplication: `3 * 4 = 12`
- `/` division: `7 / 2 = 3` (integer division — decimal is dropped), `7.0 / 2 = 3.5`
- `%` modulus (remainder): `7 % 2 = 1`
- Integer division vs float division is a very common source of bugs — always check your types

### 3.2 Relational Operators
- Return true (1) or false (0)
- `==` equal to, `!=` not equal, `>` greater than, `<` less than, `>=` greater or equal, `<=` less or equal
- `5 == 5` → true, `5 == 6` → false
- Do NOT confuse `==` (comparison) with `=` (assignment)

### 3.3 Logical Operators
- `&&` AND: both conditions must be true — `age >= 18 && hasID == true`
- `||` OR: at least one condition true — `score >= 90 || extra_credit == true`
- `!` NOT: reverses the boolean — `!false` → `true`
- Short-circuit evaluation: `&&` stops at first false, `||` stops at first true

### 3.4 Assignment and Shorthand Operators
- `=` assigns value: `x = 10;`
- `+=` add and assign: `x += 5;` is `x = x + 5;`
- `-=`, `*=`, `/=`, `%=` work the same way
- `++x` prefix increment: increment first, then use the value
- `x++` postfix increment: use the value first, then increment
- `int a = 5; int b = a++;` → `b = 5`, `a = 6`
- `int a = 5; int b = ++a;` → `b = 6`, `a = 6`

### 3.5 Operator Precedence
- Order (high to low): `()` → `++ --` → `* / %` → `+ -` → `< > <= >=` → `== !=` → `&&` → `||`
- `2 + 3 * 4 = 14` because `*` has higher precedence than `+`
- Use parentheses to make intent explicit: `(2 + 3) * 4 = 20`

---

## Topic 5: Input and Output — cin and cout

### 4.1 Output with cout
- `cout << "Hello, World!" << endl;` — prints text to the console
- `<<` is the insertion operator — chain multiple outputs: `cout << "Name: " << name << endl;`
- `endl` flushes the buffer and moves to a new line; `"\n"` just moves to new line (faster)
- Print variables: `cout << "Score: " << score << endl;`

### 4.2 Input with cin
- `cin >> age;` — reads input from the user and stores it in `age`
- `>>` is the extraction operator
- Multiple inputs: `cin >> a >> b;` reads two values separated by space or Enter
- cin skips leading whitespace automatically
- cin fails with spaces in strings — use `getline()` instead

### 4.3 Reading Strings with getline
- `cin >> name;` reads only one word — stops at the first space
- `getline(cin, name);` reads the entire line including spaces
- After using `cin >> `, call `cin.ignore();` before `getline()` to discard the leftover newline

### 4.4 Formatting Output with iomanip
- `#include <iomanip>` to access formatting tools
- `setw(10)`: set minimum field width — right-aligns by default
- `setprecision(2)` with `fixed`: show exactly 2 decimal places — `fixed << setprecision(2)`
- Example: `cout << fixed << setprecision(2) << 3.14159;` → `3.14`

### 4.5 endl vs "\n"
- Both move to the next line
- `endl` also flushes the output buffer — slower but ensures output appears immediately
- `"\n"` is faster — preferred in loops and performance-sensitive code
- For simple programs the difference is negligible

---

## Topic 6: Conditional Statements

### 5.1 What is Conditional Logic?
- Programs need to make decisions based on data
- Without conditionals, a program runs the same steps every time regardless of input
- C++ provides: `if`, `else if`, `else`, and `switch`
- Indentation is not required by the compiler but is essential for readability

### 5.2 if and else
```cpp
int marks = 75;
if (marks >= 50) {
    cout << "Pass" << endl;
} else {
    cout << "Fail" << endl;
}
```
- Condition inside parentheses after `if`
- Curly braces `{}` contain the block to execute
- `else` runs when the `if` condition is false

### 5.3 else if for Multiple Conditions
```cpp
if (marks >= 80) cout << "A";
else if (marks >= 70) cout << "B";
else if (marks >= 60) cout << "C";
else if (marks >= 50) cout << "D";
else cout << "F";
```
- Conditions are checked top to bottom — first true one executes, rest are skipped
- Can omit braces for single-statement blocks (but using braces is safer habit)

### 5.4 The switch Statement
```cpp
int choice = 2;
switch (choice) {
    case 1: cout << "New Game"; break;
    case 2: cout << "Load Game"; break;
    case 3: cout << "Exit"; break;
    default: cout << "Invalid choice";
}
```
- switch tests one variable against multiple exact values
- `break` is required to prevent fall-through to the next case
- `default` runs if no case matches — equivalent to `else`
- switch only works with int, char, and enum — not float or string

### 5.5 if-else vs switch
| if-else | switch |
|---------|--------|
| Any condition | Exact value comparison only |
| Works with ranges | Works with int/char/enum |
| More flexible | Cleaner for many exact values |

### 5.6 Decision Flowchart
- If-else logic maps directly to a flowchart: diamond = decision, two arrows = true/false
- Drawing the flowchart first helps plan the code
- Nested if = nested diamonds in the flowchart

---

## Topic 7: Loops — for, while, and do-while

### 6.1 Why Loops?
- Loops execute a block of code repeatedly while a condition holds
- Without loops: printing numbers 1–100 would require 100 lines
- With a loop: 3 lines handle it

### 6.2 The for Loop
```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";
}
// Output: 1 2 3 4 5
```
- Three parts: initialization, condition, update — all in one line
- Use when you know exactly how many iterations are needed
- The loop variable (i) is local to the for loop

### 6.3 The while Loop
```cpp
int i = 1;
while (i <= 5) {
    cout << i << " ";
    i++;
}
```
- Condition checked before each iteration — may not run at all if false initially
- Use when number of iterations depends on a condition, not a fixed count
- Always ensure the condition eventually becomes false — otherwise infinite loop

### 6.4 The do-while Loop
```cpp
int choice;
do {
    cout << "Enter 1 to continue, 0 to exit: ";
    cin >> choice;
} while (choice != 0);
```
- Body executes at least once — condition checked after
- Best for menus and input validation where you need to run once before checking

### 6.5 for vs while vs do-while
| Loop | Use when |
|------|----------|
| for | Known number of iterations |
| while | Condition-based, may not run |
| do-while | Must run at least once |

### 6.6 break and continue
- `break`: immediately exits the loop — skips all remaining iterations
- `continue`: skips the current iteration and jumps to the next
```cpp
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) continue;  // skip even numbers
    if (i > 7) break;           // stop after 7
    cout << i << " ";
}
// Output: 1 3 5 7
```

### 6.7 Nested Loops
```cpp
for (int i = 1; i <= 3; i++) {
    for (int j = 1; j <= 3; j++) {
        cout << i * j << "\t";
    }
    cout << endl;
}
```
- Each time the outer loop runs once, the inner loop completes fully

---

## Topic 8: Functions

### 7.1 What is a Function?
- A function is a named, reusable block of code that performs a specific task
- Write once, call many times from anywhere in the program
- Functions make programs organized, readable, and easier to debug
- C++ programs are built from functions — `main()` itself is a function

### 7.2 Function Declaration and Definition
```cpp
int add(int a, int b);   // declaration (prototype)

int main() {
    cout << add(5, 3);   // call
}

int add(int a, int b) {  // definition
    return a + b;
}
```
- Declaration (prototype): tells the compiler the function exists before it is defined
- If the definition appears before main(), no separate declaration is needed

### 7.3 Parameters and Return Values
- Parameters: variables listed in the function definition — `int a, int b`
- Arguments: actual values passed when calling — `add(5, 3)`
- Return type before the function name — `int add(...)` returns an int
- `return` sends the value back to the caller and exits the function
- `void` functions perform an action but return nothing

### 7.4 Default Parameters
```cpp
void greet(string name, string lang = "C++") {
    cout << name << " is learning " << lang << endl;
}
greet("Ahmad");          // uses default: C++
greet("Sara", "Python"); // overrides default
```
- Default parameters must be at the rightmost positions

### 7.5 Function Overloading
```cpp
int add(int a, int b) { return a + b; }
double add(double a, double b) { return a + b; }
```
- Same function name, different parameter types or count
- Compiler picks the correct version based on arguments

### 7.6 Scope and the Call Stack
- Local variable: declared inside a function — only accessible within that function
- Global variable: declared outside all functions — accessible everywhere (avoid overuse)
- Call stack: when main() calls add(), add()'s frame is pushed; when it returns, it is popped
- Stack frame holds: the function's local variables, parameters, and return address

---

## Topic 9: Arrays

### 8.1 What is an Array?
- An array stores multiple values of the same type under one name
- Values are stored in contiguous (side-by-side) memory locations
- Access each value with its index — indexing starts at 0
- `int scores[5] = {90, 85, 78, 92, 88};`

### 8.2 Declaring and Initializing Arrays
- `int arr[5];` — declares, values are garbage (uninitialized)
- `int arr[5] = {1, 2, 3, 4, 5};` — declares and initializes
- `int arr[] = {1, 2, 3};` — size inferred from initializer (size = 3)
- Array size must be a compile-time constant in standard C++

### 8.3 Accessing and Modifying Elements
- `scores[0]` → first element (90)
- `scores[4]` → fifth element (88)
- `scores[2] = 95;` — modifies the third element
- Accessing out-of-bounds index is undefined behavior — no error, but dangerous

### 8.4 Arrays and Loops
```cpp
int sum = 0;
for (int i = 0; i < 5; i++) {
    sum += scores[i];
}
cout << "Average: " << sum / 5.0 << endl;
```
- Always use `array_size - 1` as the last valid index

### 8.5 2D Arrays
```cpp
int matrix[3][3] = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
cout << matrix[1][2]; // row 1, col 2 → 6
```
- Think of it as a table: first index = row, second index = column
- Nested loops to traverse: outer for rows, inner for columns

### 8.6 Array vs Individual Variables
- 5 individual variables: `int s1, s2, s3, s4, s5;` — hard to scale
- Array of 5: `int s[5];` — easy to loop, easy to pass to functions
- Arrays cannot change size at runtime — for dynamic sizes use vectors (C++ STL)

---

## Topic 10: Strings in C++

### 9.1 What is a String?
- A string is a sequence of characters
- C-style string: array of char ending with null character `\0` — `char name[] = "Ahmad";`
- `std::string`: a class from `<string>` that manages character arrays automatically
- Use `std::string` in most cases — it is safer and easier than C-style strings

### 9.2 std::string Basics
```cpp
#include <string>
string name = "Ahmad";
string greeting = "Hello, " + name;   // concatenation with +
cout << greeting << endl;
cout << "Length: " << name.length() << endl;
```
- `+` concatenates two strings
- Strings can be compared with `==`, `<`, `>`

### 9.3 Common string Methods
- `name.length()` or `name.size()` → number of characters
- `name.substr(1, 3)` → `"hma"` (start at 1, take 3 characters)
- `name.find("ma")` → 2 (starting index of "ma"), returns `string::npos` if not found
- `name.replace(0, 1, "O")` → replaces 1 character at index 0 with "O"
- `name.at(2)` → `'m'` (bounds-checked access, throws exception if out of range)
- `name.empty()` → true if string has no characters

### 9.4 Reading Strings
- `cin >> name;` reads one word
- `getline(cin, name);` reads entire line including spaces
- Always `cin.ignore()` between `cin >>` and `getline()` to discard the leftover `\n`

### 9.5 C-style String vs std::string
| C-style `char[]` | `std::string` |
|------------------|---------------|
| Fixed size | Dynamic size |
| Manual null handling | Automatic |
| Faster (raw memory) | Safer and easier |
| `strcpy`, `strlen` | `.length()`, `+` operator |
- Use `std::string` unless you are working at a low level or with legacy code

---

## Topic 11: Pointers and Memory

### 10.1 What is Memory?
- RAM is like a very long street of numbered houses — each house holds one byte
- Every variable in your program lives at a specific address in RAM
- The address of variable `x` is written as `&x`
- Understanding memory is what separates C++ from higher-level languages

### 10.2 What is a Pointer?
- A pointer is a variable that stores the memory address of another variable
- `int* p = &x;` — p holds the address of x
- `*p` dereferences the pointer — gives the value at that address
- `int* p;` declares p as a pointer to int — the `*` is part of the type
- Null pointer: `int* p = nullptr;` — pointer that points to nothing (safe default)

### 10.3 Using Pointers
```cpp
int x = 10;
int* p = &x;
cout << p << endl;   // prints address, e.g. 0x7fffd4
cout << *p << endl;  // prints 10
*p = 20;             // changes x to 20 through the pointer
cout << x << endl;   // prints 20
```

### 10.4 Pointers and Arrays
- Array name is a pointer to the first element: `int arr[] = {1, 2, 3}; int* p = arr;`
- `*(p + 1)` accesses the second element (same as `arr[1]`)
- Pointer arithmetic: `p + 1` moves to the next int-sized address (4 bytes forward)

### 10.5 Pass by Pointer (Modifying via Function)
```cpp
void swap(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
int x = 5, y = 10;
swap(&x, &y);  // x=10, y=5 after
```

### 10.6 Pointers vs References
| Pointer | Reference |
|---------|-----------|
| Can be null | Cannot be null |
| Can be reassigned | Always refers to same variable |
| `int* p = &x;` | `int& r = x;` |
| Explicit dereference `*p` | Transparent — use like variable |
- References are simpler and safer for most use cases; pointers give more control

### 10.7 Memory Diagram
- When `int x = 5;` is written, the compiler reserves 4 bytes at, say, address 0x100 and stores 5
- `int* p = &x;` reserves 8 bytes (pointer size on 64-bit) at address 0x108 and stores 0x100
- `*p` reads the value at address 0x100 → 5

---

## Topic 12: Object-Oriented Programming — Classes and Objects

### 11.1 What is OOP?
- OOP organizes code around objects that combine data and the functions that work on that data
- Class: a blueprint or template — defines what data and actions an object will have
- Object: an instance of a class — the actual thing created from the blueprint
- A Car class defines: brand, speed, color (data) and accelerate(), brake() (functions)
- Your specific car is an object of the Car class

### 11.2 Defining a Class
```cpp
class Student {
public:
    string name;
    int marks;

    void display() {
        cout << name << ": " << marks << endl;
    }
};
```
- `class` keyword followed by the class name
- Members inside can be variables (attributes) or functions (methods)
- `public` means accessible from outside the class

### 11.3 Creating Objects
```cpp
Student s1;
s1.name = "Ahmad";
s1.marks = 85;
s1.display();

Student s2;
s2.name = "Sara";
s2.marks = 92;
s2.display();
```
- Each object has its own copy of the attributes
- Dot operator `.` accesses members

### 11.4 Constructors
```cpp
class Student {
public:
    string name;
    int marks;

    Student(string n, int m) {
        name = n;
        marks = m;
    }
};
Student s1("Ahmad", 85);
```
- Constructor: a special function with the same name as the class, no return type
- Automatically called when an object is created
- Used to initialize attributes with values

### 11.5 Encapsulation — private vs public
```cpp
class BankAccount {
private:
    double balance;
public:
    void deposit(double amount) {
        if (amount > 0) balance += amount;
    }
    double getBalance() { return balance; }
};
```
- `private`: accessible only inside the class — protects data from accidental change
- `public`: accessible from outside
- Encapsulation = hiding internal data and exposing controlled access through methods

### 11.6 Procedural vs OOP
- Procedural: `double getGrade(string name, int marks)` — data and functions separate
- OOP: `Student s; s.getGrade();` — data and functions bundled together
- OOP is easier to scale, maintain, and reason about in large programs

---

## Topic 13: File Handling in C++

### 12.1 Why File Handling?
- RAM is temporary — all program data is lost when the program ends
- Files on disk are permanent — data persists between runs
- C++ uses file streams from `<fstream>` header
- Three stream types: `ofstream` (write), `ifstream` (read), `fstream` (both)

### 12.2 Writing to a File
```cpp
#include <fstream>
ofstream file("data.txt");
if (file.is_open()) {
    file << "Ahmad" << endl;
    file << "Marks: 85" << endl;
    file.close();
}
```
- `ofstream` creates or overwrites the file
- `file.is_open()` checks if the file opened successfully — always check
- `file.close()` flushes and closes the file

### 12.3 Reading from a File
```cpp
ifstream file("data.txt");
string line;
while (getline(file, line)) {
    cout << line << endl;
}
file.close();
```
- `getline(file, line)` reads one line at a time
- The while loop runs until the file ends (getline returns false at EOF)

### 12.4 File Open Modes
- `ios::out` — write, overwrite existing (default for ofstream)
- `ios::app` — append to end without deleting existing content
- `ios::in` — read (default for ifstream)
- Combined: `fstream file("data.txt", ios::in | ios::out);`
- `ofstream file("data.txt", ios::app);` — append mode

### 12.5 File Handling Flowchart
- Open file → check if open → read or write in loop → close file
- Always close files to ensure data is written and resources are freed

---

## Topic 14: Debugging and Reading Compiler Errors

### 13.1 Types of Errors
- **Syntax errors**: violate C++ grammar — caught at compile time with line numbers
  - Missing semicolon, mismatched braces, wrong spelling of keywords
- **Runtime errors**: occur while running — program crashes
  - Division by zero, null pointer dereference, array out of bounds
- **Logic errors**: program runs without crashing but gives wrong output
  - Using `=` instead of `==`, off-by-one in loops, wrong formula

### 13.2 Reading Compiler Error Messages
- Error message format: `filename.cpp:line:column: error: description`
- Start from the first error — later errors are often caused by the first one
- Common messages:
  - `expected ';' before '}'` → missing semicolon on the previous line
  - `undeclared identifier 'x'` → variable not declared or spelled wrong
  - `no matching function for call` → wrong argument types or count
- Fix one error at a time, recompile, and see if others disappear

### 13.3 Common C++ Errors and Fixes
```cpp
// Error: using = instead of == in condition
if (x = 5)   // assigns 5 to x — always true!
if (x == 5)  // correct comparison

// Error: infinite loop — forgot to increment
int i = 0;
while (i < 5) { cout << i; }    // i never changes
while (i < 5) { cout << i++; }  // correct

// Error: array out of bounds
int arr[5];
arr[5] = 10;  // index 5 does not exist (0-4 valid)
```

### 13.4 Debugging with cout
- Insert `cout` statements to print variable values at key points
- `cout << "Before loop, x = " << x << endl;`
- Comment out or remove debug lines after fixing the issue
- Simple but effective — used by professionals too

### 13.5 Using the VS Code / Visual Studio Debugger
- Set a breakpoint: click to the left of a line number (red dot appears)
- Press F5 to run with debugger — program pauses at the breakpoint
- Step Over (F10): execute the current line and move to the next
- Step Into (F11): go inside a function call
- Watch panel: monitor the value of specific variables as you step
- Call Stack panel: see which functions are currently active

### 13.6 Debugging Workflow
- Reproduce the bug consistently with a specific input
- Narrow down which section of code causes it
- Add breakpoints or cout around the suspected area
- Inspect variable values at that point
- Fix the code, test again, remove debug output

---

## Topic 15: Major Practice Programs — Complete Code Walkthroughs

### Program 1: Student Record System
```cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

const int MAX = 50;
string names[MAX];
int marks[MAX];
int count = 0;

char getGrade(int m) {
    if (m >= 80) return 'A';
    if (m >= 70) return 'B';
    if (m >= 60) return 'C';
    if (m >= 50) return 'D';
    return 'F';
}

void addStudent() {
    if (count >= MAX) { cout << "Record full.\n"; return; }
    cout << "Name: "; cin >> names[count];
    cout << "Marks: "; cin >> marks[count];
    count++;
    cout << "Student added.\n";
}

void displayAll() {
    cout << "\n--- Student Records ---\n";
    cout << "Name\t\tMarks\tGrade\n";
    for (int i = 0; i < count; i++)
        cout << names[i] << "\t\t" << marks[i] << "\t" << getGrade(marks[i]) << "\n";
}

void saveToFile() {
    ofstream file("students.txt");
    for (int i = 0; i < count; i++)
        file << names[i] << " " << marks[i] << " " << getGrade(marks[i]) << "\n";
    file.close();
    cout << "Saved to students.txt\n";
}

int main() {
    int choice;
    do {
        cout << "\n1.Add  2.Display  3.Save  0.Exit\nChoice: ";
        cin >> choice;
        if (choice == 1) addStudent();
        else if (choice == 2) displayAll();
        else if (choice == 3) saveToFile();
    } while (choice != 0);
    return 0;
}
```

### Program 2: Menu-Driven Calculator with History
```cpp
#include <iostream>
#include <fstream>
using namespace std;

const int MAX_HISTORY = 100;
string history[MAX_HISTORY];
int histCount = 0;

void record(string entry) {
    if (histCount < MAX_HISTORY)
        history[histCount++] = entry;
}

void showHistory() {
    cout << "\n--- Calculation History ---\n";
    for (int i = 0; i < histCount; i++)
        cout << i + 1 << ". " << history[i] << "\n";
}

void saveHistory() {
    ofstream file("history.txt", ios::app);
    for (int i = 0; i < histCount; i++)
        file << history[i] << "\n";
    file.close();
    cout << "History saved to history.txt\n";
}

int main() {
    double a, b;
    int choice;
    do {
        cout << "\n1.Add  2.Subtract  3.Multiply  4.Divide  5.History  6.Save  0.Exit\nChoice: ";
        cin >> choice;
        if (choice >= 1 && choice <= 4) {
            cout << "Enter two numbers: ";
            cin >> a >> b;
        }
        double result = 0;
        string entry;
        if (choice == 1) { result = a + b; entry = to_string(a) + " + " + to_string(b) + " = " + to_string(result); }
        else if (choice == 2) { result = a - b; entry = to_string(a) + " - " + to_string(b) + " = " + to_string(result); }
        else if (choice == 3) { result = a * b; entry = to_string(a) + " * " + to_string(b) + " = " + to_string(result); }
        else if (choice == 4) {
            if (b == 0) { cout << "Cannot divide by zero.\n"; continue; }
            result = a / b;
            entry = to_string(a) + " / " + to_string(b) + " = " + to_string(result);
        }
        if (choice >= 1 && choice <= 4) {
            cout << "Result: " << result << "\n";
            record(entry);
        }
        else if (choice == 5) showHistory();
        else if (choice == 6) saveHistory();
    } while (choice != 0);
    return 0;
}
```

### Program 3: Bank Account Management System (OOP)
```cpp
#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    string owner;
    double balance;

public:
    BankAccount(string name, double startBalance) {
        owner = name;
        balance = startBalance;
        cout << "Account created for " << owner << " with balance: " << balance << "\n";
    }

    void deposit(double amount) {
        if (amount <= 0) { cout << "Invalid amount.\n"; return; }
        balance += amount;
        cout << "Deposited " << amount << ". New balance: " << balance << "\n";
    }

    void withdraw(double amount) {
        if (amount <= 0) { cout << "Invalid amount.\n"; return; }
        if (amount > balance) { cout << "Insufficient funds.\n"; return; }
        balance -= amount;
        cout << "Withdrew " << amount << ". New balance: " << balance << "\n";
    }

    void displayBalance() const {
        cout << owner << "'s balance: " << balance << "\n";
    }

    string getOwner() const { return owner; }
};

int main() {
    BankAccount acc1("Ahmad", 5000);
    BankAccount acc2("Sara", 3000);

    acc1.deposit(1500);
    acc1.withdraw(800);
    acc1.displayBalance();

    acc2.deposit(2000);
    acc2.withdraw(5000);  // should fail
    acc2.displayBalance();

    cout << "\n--- Final Balances ---\n";
    acc1.displayBalance();
    acc2.displayBalance();

    return 0;
}
```
