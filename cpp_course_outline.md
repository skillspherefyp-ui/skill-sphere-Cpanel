# Introduction to Programming Using C++
## Comprehensive Course Outline

---

## Module 1: Introduction to Programming and C++

### 1.1 What is Programming

- Definition of a computer program: a set of instructions given to a computer to perform a specific task
- How a computer follows instructions step by step from top to bottom
- The role of a programmer: writing, testing, and fixing instructions
- Difference between hardware (physical parts) and software (programs and data)
- Types of programming languages
  - Machine language: binary code (0s and 1s) that the CPU understands directly
  - Assembly language: uses short human-readable codes like MOV, ADD that map to machine instructions
  - High-level languages: English-like syntax such as Python, Java, C++
  - Middle-level languages: combine high-level readability with low-level control, for example C and C++
- Compiled languages vs interpreted languages
  - Compiled: entire source code is translated to machine code before running (C, C++, Go)
  - Interpreted: code is translated and executed line by line at runtime (Python, JavaScript)
  - Compilation produces faster executable programs

### 1.2 Introduction to C++

- C++ was developed by Bjarne Stroustrup at Bell Labs starting in 1979
- Originally called "C with Classes" and renamed to C++ in 1983
- The ++ in the name comes from the increment operator in C, meaning an improved version of C
- Why C++ is widely used
  - Very fast execution speed due to direct memory control
  - Used in system software, game engines, embedded systems, and competitive programming
  - Large existing codebase and industry adoption
- C++ as a middle-level language
  - Provides high-level features like classes and objects
  - Also allows low-level operations like pointer arithmetic and direct memory management
- Relationship between C and C++
  - C++ is mostly backward compatible with C
  - Most valid C programs can be compiled as C++ programs
  - C++ adds object-oriented programming, templates, exceptions, and the standard library
- C++ standards over the years
  - C++98: the first standardized version
  - C++11: introduced auto, nullptr, range-based for loop, lambda expressions
  - C++14 and C++17: further improvements and additions
  - Understanding which standard an IDE or compiler uses by default

### 1.3 Setting Up the Development Environment

- What a compiler is
  - A compiler is a program that reads your source code (.cpp file) and translates it into machine code that the computer's processor can execute
  - The translation happens all at once before the program runs, unlike an interpreter which runs code line by line
  - During compilation, the compiler checks for syntax errors and reports them with line numbers before producing any output
  - If there are no errors, the compiler produces an executable file (.exe on Windows) that can be run directly
- What an IDE is
  - An IDE (Integrated Development Environment) is a software application that combines everything a programmer needs into one place
  - It includes a code editor with syntax highlighting and auto-complete, a built-in compiler, a debugger, and a file manager
  - Instead of using separate tools, you write, compile, and run code all from within the IDE
  - Popular examples: Visual Studio, Code::Blocks, Dev-C++, CLion
- Setting up Visual Studio (recommended for beginners on Windows)
  - Visual Studio is a full professional IDE made by Microsoft that comes with everything needed for C++ out of the box
  - Download Visual Studio Community edition for free from visualstudio.microsoft.com (completely free for students)
  - Run the installer
  - In the Visual Studio Installer, select the workload called "Desktop development with C++"
  - Click Install; this automatically installs Visual Studio along with the Microsoft C++ compiler (MSVC), the debugger, and all required C++ tools
  - No separate compiler download or PATH configuration is needed; everything is set up automatically
  - Creating and running your first C++ program in Visual Studio
    - Open Visual Studio and click "Create a new project"
    - Select "Console App" under C++ and click Next
    - Give the project a name, choose a save location, and click Create
    - Visual Studio opens a ready-to-use main.cpp file with a basic Hello World program
    - Write or modify the code in the editor
    - Press F5 to compile and run the program with debugging; a console window opens showing the output
    - Press Ctrl+F5 to run without the debugger (the console window stays open after the program finishes)
  - What the C/C++ tools workload includes
    - The MSVC compiler which compiles your .cpp files into executable programs
    - IntelliSense: auto-complete suggestions and real-time error highlighting as you type
    - A built-in debugger for setting breakpoints and inspecting variable values
    - The Solution Explorer panel for managing all project files in one place
- Steps to write and run any C++ program
  - Step 1: Write the source code in a .cpp file using a text editor or IDE
  - Step 2: The compiler reads the source file and checks for errors
  - Step 3: If no errors exist, the compiler produces an object file (.o) containing machine code
  - Step 4: The linker combines the object file with any library code to produce the final executable (.exe on Windows)
  - Step 5: Run the executable; the output appears in the terminal or console
- Types of errors a programmer encounters
  - Syntax errors: violations of C++ grammar rules, caught by the compiler before the program runs
  - Runtime errors: errors that occur while the program is running, such as dividing by zero
  - Logic errors: the program compiles and runs without crashing but produces wrong results

### 1.4 Structure of a C++ Program

- The #include directive
  - Tells the preprocessor to include the contents of a header file
  - #include <iostream> brings in the input and output functions
  - The preprocessor runs before the compiler and handles directives starting with #
- The using namespace std statement
  - Avoids writing std:: before every standard library function
  - Without it, you must write std::cout and std::cin
- The main() function
  - Every C++ program must have exactly one main() function
  - Execution always begins at the first line inside main()
  - int before main means the function returns an integer value to the operating system
- Opening brace { and closing brace }
  - Define the beginning and end of a block of code
  - Every opening brace must have a matching closing brace
- Statements and semicolons
  - Every statement in C++ ends with a semicolon
  - A missing semicolon is one of the most common syntax errors
- The return 0 statement
  - Signals to the operating system that the program ended successfully
- Case sensitivity
  - C++ distinguishes between uppercase and lowercase letters
  - Main is not the same as main; cout is not the same as Cout
- Whitespace and indentation
  - Spaces, tabs, and blank lines are ignored by the compiler
  - Proper indentation makes code readable and easier to understand

Example of a minimal C++ program:

    #include <iostream>
    using namespace std;

    int main() {
        cout << "Hello, World!" << endl;
        return 0;
    }

---

## Module 2: Variables, Data Types, and Constants

### 2.1 What is a Variable

- A variable is a named storage location in the computer's memory that holds a value
- Think of it as a labeled box that can store one piece of information at a time
- The value inside a variable can be changed during program execution
- Every variable has three important properties
  - Name (identifier): used to refer to the variable in code
  - Data type: determines what kind of value it can hold and how much memory it uses
  - Value: the actual data stored at that moment

### 2.2 Declaring and Initializing Variables

- Declaration: telling the compiler that a variable with a given name and type exists
  - Syntax: data_type variable_name;
  - Example: int age;
- Initialization: assigning a value to a variable at the time of declaration
  - Syntax: data_type variable_name = value;
  - Example: int age = 20;
- Assignment after declaration: giving a value to a variable after it is declared
  - Example: age = 25;
- Declaring multiple variables of the same type on one line
  - Example: int x = 5, y = 10, z = 15;
- What happens if a variable is used before it is initialized
  - It contains a garbage value (random leftover data in memory)
  - Always initialize variables before using them

### 2.3 Rules for Naming Variables

- Variable names can contain letters, digits, and underscores
- The name must start with a letter or an underscore, not a digit
- Variable names cannot contain spaces or special symbols like @, #, or $
- C++ keywords cannot be used as variable names (int, float, return, if, while, for)
- Variable names are case-sensitive: score, Score, and SCORE are three different variables
- Good naming habits
  - Use descriptive names that explain what the variable stores
  - Use camelCase (studentAge) or underscore_separated (student_age) consistently
  - Avoid single-letter names except for simple loop counters like i, j, k

Valid variable names: age, student_name, totalScore, x1
Invalid variable names: 1age, my-name, float, total score

### 2.4 Fundamental Data Types

Integer types (whole numbers without a decimal point)
- int
  - Standard integer type, typically 4 bytes (32 bits)
  - Range: -2,147,483,648 to 2,147,483,647
  - Example: int score = 95;
- short int (or just short)
  - Uses 2 bytes (16 bits), range: -32,768 to 32,767
- long int (or just long)
  - 4 or 8 bytes depending on the system, larger range than int
- long long int (or just long long)
  - 8 bytes (64 bits)
  - Example: long long bigNumber = 9000000000;

Floating point types (numbers with a decimal point)
- float
  - 4 bytes, single precision, up to approximately 7 significant decimal digits
  - Example: float price = 19.99f;
- double
  - 8 bytes, double precision, up to approximately 15 significant decimal digits
  - Default type for decimal numbers in C++
  - Example: double pi = 3.14159265358979;
- long double
  - Extended precision, typically 12 or 16 bytes

Character type
- char
  - Stores a single character such as a letter, digit, or symbol, occupies 1 byte
  - Characters are enclosed in single quotes: 'A', '5', '@'
  - Internally stored as an integer using the ASCII code ('A' is 65, 'a' is 97)
  - Example: char grade = 'A';

Boolean type
- bool
  - Stores only true or false; internally true is 1 and false is 0
  - Example: bool isPassed = true;

Void type
- Represents the absence of a type
- Used for functions that do not return any value

### 2.5 Signed and Unsigned Types

- By default, int, short, long, and char are signed (hold negative and positive values)
- Unsigned modifier allows only non-negative values but doubles the positive range
  - unsigned int range: 0 to 4,294,967,295
  - unsigned char range: 0 to 255
- Declaration examples: unsigned int count = 100; unsigned char byte = 200;

### 2.6 Size of Data Types

- The sizeof() operator returns the number of bytes a data type or variable uses
- Example: sizeof(int) returns 4 on most systems
- Sizes can differ across operating systems and compilers

      cout << sizeof(int) << endl;
      cout << sizeof(double) << endl;
      cout << sizeof(char) << endl;

### 2.7 Constants

- A constant is a value that is set once and never changes during program execution
- Using the const keyword
  - const data_type NAME = value;
  - Example: const double PI = 3.14159;
  - Attempting to change a const variable causes a compiler error
- Using the #define preprocessor directive
  - #define PI 3.14159
  - The preprocessor replaces every occurrence of PI with 3.14159 before compilation
- Differences between const and #define
  - const has a data type and is checked by the compiler
  - #define is a simple text substitution with no type checking
  - const is preferred in modern C++
- Naming convention: constants are typically written in ALL_CAPS
  - Examples: MAX_SIZE, SPEED_OF_LIGHT, TAX_RATE

### 2.8 The auto Keyword

- Introduced in C++11 to let the compiler automatically deduce the data type
- Example: auto x = 10; (x becomes int), auto y = 3.14; (y becomes double)
- Not recommended for beginners when learning types because it hides the data type

---

## Module 3: Input and Output

### 3.1 Output with cout

- cout stands for character output and is used to display information on the screen
- The insertion operator << sends data to cout
- Printing a string literal: cout << "Hello, World!";
- Printing a variable: cout << age;
- Printing a combination: cout << "Age is: " << age;
- Moving to the next line
  - endl: flushes the output buffer and moves to a new line
  - \n inside a string: moves to a new line without flushing the buffer
- Common escape sequences
  - \n: newline
  - \t: horizontal tab
  - \\: backslash character
  - \": double quote inside a string

### 3.2 Input with cin

- cin stands for character input and reads data typed by the user from the keyboard
- The extraction operator >> reads data from cin into a variable
- Reading an integer: cin >> age;
- Reading a double: cin >> salary;
- Reading a character: cin >> grade;
- Reading multiple values: cin >> x >> y; (user separates values with spaces)
- If the user enters the wrong type, cin fails silently
- cin skips leading whitespace automatically before reading

### 3.3 Reading Strings with cin and getline

- cin >> word reads only up to the first space
- getline(cin, variableName) reads a full line including spaces
- The buffer problem when mixing cin and getline
  - After cin reads a number, the newline (Enter key) remains in the buffer
  - getline reads that leftover newline and immediately returns empty
  - Fix: use cin.ignore() after cin before calling getline
  - Example: cin >> age; cin.ignore(); getline(cin, name);

### 3.4 Formatted Output with iomanip

- The iomanip header provides tools to format how numbers and text are displayed
- setw(n): sets the minimum width of the next output field
  - cout << setw(10) << 42; prints 42 right-aligned in a field of 10 characters
- setprecision(n): controls decimal digits shown for floating point numbers
  - cout << fixed << setprecision(2) << 3.14159; prints 3.14
- setfill(c): fills empty spaces with character c
  - cout << setfill('0') << setw(5) << 42; prints 00042
- left and right: control alignment within the field width

---

## Module 4: Operators

### 4.1 Arithmetic Operators

- Addition (+): int sum = 5 + 3; (result is 8)
- Subtraction (-): int diff = 10 - 4; (result is 6)
- Multiplication (*): int product = 6 * 7; (result is 42)
- Division (/)
  - Integer division: int result = 7 / 2; (result is 3, decimal part discarded)
  - Floating point division: double result = 7.0 / 2; (result is 3.5)
- Modulus (%): int rem = 10 % 3; (result is 1)
  - Only works with integer operands
  - Useful for checking even/odd: number % 2 == 0 means even
- Operator precedence (highest to lowest): parentheses, then *, /, %, then +, -
  - 2 + 3 * 4 evaluates as 14; (2 + 3) * 4 evaluates as 20

### 4.2 Assignment Operators

- Simple assignment (=): x = 10;
- Compound assignment operators
  - += : x += 5 is the same as x = x + 5
  - -= : x -= 3 is the same as x = x - 3
  - *= : x *= 2 is the same as x = x * 2
  - /= : x /= 4 is the same as x = x / 4
  - %= : x %= 7 is the same as x = x % 7

### 4.3 Increment and Decrement Operators

- Pre-increment (++x): increments x first, then uses the new value
- Post-increment (x++): uses the current value, then increments
  - int x = 5; int a = ++x; (x becomes 6, a is 6)
  - int x = 5; int b = x++; (b is 5, then x becomes 6)
- Pre-decrement (--x) and post-decrement (x--) work the same way for subtraction

### 4.4 Relational (Comparison) Operators

- Equal to (==): tests if two values are equal; very common mistake is using = instead of ==
- Not equal to (!=): true when the two values are different
- Greater than (>), Less than (<)
- Greater than or equal to (>=), Less than or equal to (<=)
- The result of any comparison is either 1 (true) or 0 (false)

### 4.5 Logical Operators

- Logical AND (&&): result is true only if BOTH conditions are true
  - Example: if (age >= 18 && age <= 65)
  - Short-circuit: if the first condition is false, the second is not evaluated
- Logical OR (||): result is true if AT LEAST ONE condition is true
  - Example: if (grade == 'A' || grade == 'B')
  - Short-circuit: if the first condition is true, the second is not evaluated
- Logical NOT (!): reverses the boolean value
  - !true is false, !false is true

### 4.6 Conditional (Ternary) Operator

- Syntax: condition ? value_if_true : value_if_false
- Example: int max = (a > b) ? a : b;
- Can be used inside cout: cout << (x % 2 == 0 ? "Even" : "Odd");

### 4.7 Type Casting

- Implicit conversion: the compiler converts automatically when safe
  - int to double: int x = 5; double y = x; (y becomes 5.0)
- Explicit conversion (casting)
  - C-style: (int)3.7 gives 3
  - C++ style: static_cast<int>(3.7) gives 3 (preferred)
- Casting double to int discards the decimal part (truncates, does not round)

---

## Module 5: Control Flow - Decision Making

### 5.1 The if Statement

- Executes a block of code only when a condition is true
- Syntax: if (condition) { statements; }
- Multi-statement if with braces (always recommended)

      if (x > 0) {
          cout << "Positive";
          cout << " number";
      }

- Nested if: an if statement inside another if statement

### 5.2 The if-else Statement

- Adds a block that executes when the condition is false

      if (number % 2 == 0) {
          cout << "Even";
      } else {
          cout << "Odd";
      }

- Common mistake: putting a semicolon after the if condition
  - if (x > 0); means do nothing if true, then always execute the next line

### 5.3 The else if Ladder

- Used when there are more than two possibilities to check
- Only the first matching block executes; the rest are skipped

      if (percent >= 90) cout << "A";
      else if (percent >= 80) cout << "B";
      else if (percent >= 70) cout << "C";
      else if (percent >= 60) cout << "D";
      else cout << "F";

### 5.4 The switch Statement

- Used to compare one variable against several fixed integer or character values

      switch (variable) {
          case value1:
              // code
              break;
          case value2:
              // code
              break;
          default:
              // code when no case matches
      }

- break exits the switch block; without it execution falls through to the next case
- Limitations: only works with int, char, short, long, enum; not float or string

### 5.5 Practical Decision-Making Examples

- Check if a number is positive, negative, or zero
- Find the largest of three numbers
- Check if a year is a leap year
- Simple calculator using switch for the operator (+, -, *, /)
- Grade calculator: input percentage, output letter grade

---

## Module 6: Control Flow - Loops

### 6.1 Why Loops Are Needed

- Repeating code manually is impractical when the repetition count is large or unknown
- A loop repeats a block of code while a condition remains true
- Iteration: one pass through the loop body

### 6.2 The for Loop

- Best used when the number of iterations is known in advance
- Syntax: for (initialization; condition; update) { loop body }
- Counting from 1 to 10

      for (int i = 1; i <= 10; i++) {
          cout << i << " ";
      }

- Counting down: for (int i = 10; i >= 1; i--)
- Counting in steps of 2: for (int i = 0; i <= 20; i += 2)
- Common mistake: semicolon after for(...) makes the loop body empty

### 6.3 The while Loop

- Best used when the number of iterations is not known in advance
- Condition is checked BEFORE each iteration (pre-test loop)

      int i = 1;
      while (i <= 5) {
          cout << i << " ";
          i++;
      }

- Infinite loop: when the condition never becomes false
- Input validation with while loop

      while (age < 1 || age > 120) {
          cout << "Invalid. Try again: ";
          cin >> age;
      }

### 6.4 The do-while Loop

- Condition is checked AFTER the loop body (post-test loop)
- The loop body always executes at least once

      do {
          cout << "1. Start\n2. Exit\nEnter choice: ";
          cin >> choice;
      } while (choice != 1 && choice != 2);

- Note the semicolon after the closing parenthesis; it is required

### 6.5 Loop Control Statements

- break: immediately exits the nearest enclosing loop or switch

      for (int i = 0; i < 100; i++) {
          if (array[i] == target) {
              cout << "Found at index " << i;
              break;
          }
      }

- continue: skips the rest of the current iteration and moves to the next

      for (int i = 1; i <= 20; i++) {
          if (i % 3 == 0) continue;
          cout << i << " ";
      }

- goto: transfers control to a labeled statement; generally avoided in modern C++

### 6.6 Nested Loops

- A loop placed inside another loop
- The inner loop completes all its iterations for each single iteration of the outer loop

      for (int row = 1; row <= 3; row++) {
          for (int col = 1; col <= 3; col++) {
              cout << "* ";
          }
          cout << endl;
      }

- Printing a right-angled triangle, multiplication table using nested loops

### 6.7 Common Loop Patterns

- Sum of first N natural numbers
- Factorial of N
- Fibonacci series: each term is the sum of the previous two
- Check if a number is prime
- Reverse digits of a number
- Sum of digits of a number
- Print star and number patterns

---

## Module 7: Functions

### 7.1 Introduction to Functions

- A function is a named block of code that performs a specific task
- Write once, call as many times as needed
- Benefits: reusability, readability, modularity, easier debugging
- Types: built-in library functions (sqrt, abs, toupper) and user-defined functions

### 7.2 Defining a Function

- Four parts: return type, function name, parameter list, function body

      return_type functionName(parameter1_type parameter1_name) {
          // function body
          return value;
      }

- Example

      int add(int a, int b) {
          int result = a + b;
          return result;
      }

### 7.3 Calling a Function

- Invoke by writing the function name followed by arguments in parentheses

      int sum = add(5, 3);   // sum gets 8
      cout << add(10, 20);   // prints 30

- A void function is called as a statement, not used in an expression

### 7.4 Function Prototypes

- A prototype declares the function signature before the actual definition
- Needed when main() is at the top and helper functions are defined below it

      int add(int, int); // prototype

      int main() {
          cout << add(5, 3);
      }

      int add(int a, int b) { return a + b; }

### 7.5 Parameters and Arguments

- Formal parameters: variable names in the function definition
- Actual arguments: real values passed when calling
- Number and types must match exactly

### 7.6 Return Values

- return expression; sends the value back to the caller and exits the function
- A void function can use return; with no value to exit early

### 7.7 Pass by Value

- A copy of the argument is passed; changes inside do not affect the original

      void addTen(int x) { x += 10; }
      int num = 5;
      addTen(num);
      cout << num; // still 5

### 7.8 Pass by Reference

- The function receives the actual variable; changes affect the original

      void addTen(int &x) { x += 10; }
      int num = 5;
      addTen(num);
      cout << num; // now 15

### 7.9 Default Arguments

- A parameter can have a default value used when the caller does not provide it
- Default arguments must be listed from right to left

      void greet(string name, string msg = "Hello") {
          cout << msg << ", " << name << "!";
      }
      greet("Ali");          // Hello, Ali!
      greet("Sara", "Hi");  // Hi, Sara!

### 7.10 Function Overloading

- Multiple functions can share the same name if their parameter lists differ
- The compiler picks the correct version based on the arguments provided

      int area(int side);
      int area(int length, int width);

### 7.11 Recursion

- A function that calls itself
- Requires a base case (stops recursion) and a recursive case

      int factorial(int n) {
          if (n == 0 || n == 1) return 1; // base case
          return n * factorial(n - 1);    // recursive case
      }

- Without a base case, the function calls itself forever causing a stack overflow
- Recursion is elegant but uses more memory than iteration

### 7.12 Scope of Variables

- Local variables: declared inside a function, accessible only there
- Global variables: declared outside all functions, accessible everywhere
- Global variables should be used sparingly
- Variable shadowing: a local variable hides a global one with the same name

### 7.13 Storage Classes

- auto: default for local variables
- static: local variable that retains its value between function calls

      void countCalls() {
          static int count = 0;
          count++;
          cout << "Called " << count << " times" << endl;
      }

- extern: declares a variable defined in another source file

---

## Module 8: Arrays

### 8.1 Introduction to Arrays

- A collection of a fixed number of elements of the same data type in contiguous memory
- All elements are accessed using the same name but different index numbers

### 8.2 Declaring and Initializing Arrays

- Syntax: data_type arrayName[size];
- Initializing at declaration

      int scores[5] = {90, 85, 78, 92, 88};

- Partial initialization: remaining elements set to zero automatically
- Declaring without size: int days[] = {31, 28, 31}; (compiler counts values)

### 8.3 Accessing Array Elements

- Array indexing starts at 0; last index is size minus 1
- Reading: cout << scores[0]; Modifying: scores[2] = 95;
- Out-of-bounds access causes undefined behavior (compiler does not check this)

### 8.4 Traversing Arrays with Loops

      for (int i = 0; i < 5; i++) {
          cout << scores[i] << " ";
      }

- Reading into array: cin >> scores[i];
- Calculating sum, average, finding minimum and maximum value

### 8.5 Passing Arrays to Functions

- Arrays are always passed by reference (address of first element is passed)
- Size must be passed as a separate parameter

      void printArray(int arr[], int size) {
          for (int i = 0; i < size; i++) cout << arr[i] << " ";
      }

### 8.6 Multidimensional Arrays

- A 2D array is like a table with rows and columns
- Declaration: int matrix[3][4]; (3 rows, 4 columns)

      int grid[2][3] = { {1, 2, 3}, {4, 5, 6} };

      for (int row = 0; row < 2; row++) {
          for (int col = 0; col < 3; col++) {
              cout << grid[row][col] << " ";
          }
          cout << endl;
      }

### 8.7 Common Array Operations

- Linear search: scan each element one by one to find a target value
- Bubble sort: repeatedly compare adjacent elements and swap if out of order
- Reversing an array: swap elements from both ends moving toward the center
- Copying: loop through and copy each element individually

---

## Module 9: Strings

### 9.1 C-Style Strings

- An array of characters ending with the null character '\0'

      char name[20];
      char city[] = "Karachi"; // automatically adds '\0'

- Reading with cin reads one word; cin.getline(arr, size) reads a full line
- Common functions from cstring header
  - strlen(str): length of string
  - strcpy(dest, src): copy string
  - strcat(dest, src): concatenate strings
  - strcmp(s1, s2): compare strings; returns 0 if equal

### 9.2 The C++ string Class

- Safer and more convenient; manages its own memory

      string name;
      string city = "Lahore";
      string full = firstName + " " + lastName; // concatenation

- Comparing with == and != works correctly
- Useful methods
  - length() or size(): number of characters
  - empty(): true if no characters
  - substr(start, length): extract a portion
  - find(substring): position of first match
  - replace(start, length, newStr): replace part of string
  - erase(start, length): remove characters
  - at(index): access with bounds checking

### 9.3 String Practice Examples

- Count vowels in a sentence
- Count words in a sentence
- Reverse a string
- Check if a string is a palindrome
- Convert to uppercase or lowercase using toupper() or tolower()
- Remove all spaces from a string

---

## Module 10: Pointers

### 10.1 Memory and Addresses

- Every variable occupies a memory address (a unique number shown in hexadecimal)
- The address-of operator (&) returns the memory address of a variable

      int x = 42;
      cout << &x; // prints the address, for example 0x61ff08

### 10.2 Pointer Variables

- A pointer is a variable that stores a memory address

      int *ptr;       // ptr is a pointer to an integer
      int *ptr = &x;  // ptr holds the address of x

- Null pointer: int *ptr = nullptr; (points to nothing)
- Uninitialized pointers contain garbage; using them causes undefined behavior

### 10.3 Dereferencing Pointers

- The dereference operator (*) accesses the value at the address a pointer holds

      cout << *ptr; // prints 42
      *ptr = 100;
      cout << x;    // now x is 100

- In a declaration: int *ptr means ptr is a pointer variable
- In an expression: *ptr accesses the value stored at the address

### 10.4 Pointer Arithmetic

- Adding an integer moves the pointer forward by that many elements
- int *ptr; ptr + 1 moves 4 bytes forward (size of int)
- This is how arrays can be traversed with pointers

### 10.5 Pointers and Arrays

- The name of an array is a constant pointer to its first element

      cout << *(arr + 2); // same as arr[2]

### 10.6 Dynamic Memory Allocation

- Allocating a single variable at runtime

      int *ptr = new int;
      *ptr = 50;
      delete ptr;
      ptr = nullptr;

- Allocating an array dynamically

      int *arr = new int[100];
      delete[] arr; // must use delete[] for arrays

- Memory leaks: forgetting to delete causes the program to waste memory
- Always pair new with delete, and new[] with delete[]

---

## Module 11: References

### 11.1 What is a Reference

- A reference is another name (alias) for an existing variable
- Must be initialized at declaration and cannot be changed to refer to another variable

      int x = 10;
      int &ref = x; // ref is an alias for x
      ref = 20;     // changes x to 20

### 11.2 References vs Pointers

- A reference cannot be null; a pointer can
- A reference is automatically dereferenced; a pointer requires *
- References are simpler; pointers offer more flexibility

### 11.3 References in Functions

- Pass by reference: changes affect the original variable

      void swap(int &a, int &b) {
          int temp = a;
          a = b;
          b = temp;
      }

- const reference: read-only access without copying

      void print(const string &name) {
          cout << name;
      }

---

## Module 12: Structures

### 12.1 Introduction to Structures

- A structure groups multiple variables of different types under one name
- Useful for representing real-world entities (a student has name, ID, GPA)

### 12.2 Defining and Using Structures

      struct Student {
          string name;
          int id;
          double gpa;
      };

      Student s1 = {"Ali", 101, 3.8};
      cout << s1.name;
      s1.gpa = 3.9;

- Array of structures: Student roster[30];

### 12.3 Structures and Functions

      void printStudent(const Student &s) {
          cout << s.name << " - " << s.gpa;
      }

### 12.4 Pointers to Structures

- The arrow operator (->) accesses members through a pointer

      Student *ptr = &s1;
      cout << ptr->name; // same as (*ptr).name

---

## Module 13: File Handling

### 13.1 Introduction to Files

- Data in variables is lost when the program ends; files allow data to persist
- Types: text files (human-readable) and binary files
- Required header: #include <fstream>
- ofstream: write to a file, ifstream: read from a file, fstream: read and write

### 13.2 Writing to a File

      ofstream outFile("data.txt");
      if (outFile.is_open()) {
          outFile << "Hello, File!" << endl;
          outFile << 42 << endl;
          outFile.close();
      }

- Opening modes: ios::out (create/overwrite), ios::app (append), ios::trunc (erase first)

### 13.3 Reading from a File

      ifstream inFile("data.txt");
      if (inFile.is_open()) {
          string line;
          while (getline(inFile, line)) {
              cout << line << endl;
          }
          inFile.close();
      }

- Always check is_open() before reading or writing

---

## Module 14: Error Handling and Debugging

### 14.1 Types of Errors

- Syntax errors: violations of C++ grammar caught by the compiler before the program runs
- Runtime errors: occur while the program is running (division by zero, null pointer dereference, array out of bounds)
- Logic errors: the program runs without crashing but produces incorrect output (wrong formula, wrong condition)

### 14.2 Debugging Strategies

- Read the compiler error message carefully: it tells you the exact line number and what is wrong
- Use cout statements to print variable values at different points to trace what is happening
- Use the Visual Studio debugger
  - Set a breakpoint by clicking the grey margin to the left of the line number (a red dot appears)
  - Press F5 to run in debug mode; execution pauses at breakpoints
  - Hover over a variable while paused to see its current value
  - Use Step Over (F10) to execute one line at a time
  - Use Step Into (F11) to enter a function and debug inside it
- Test with boundary values: zero, negative numbers, very large numbers, empty strings
- Check for off-by-one errors in loops (using < vs <= by mistake)

### 14.3 Exception Handling

- An exception is an error that occurs at runtime and disrupts the normal program flow
- Exception handling using try, throw, and catch

      try {
          if (denominator == 0) throw "Division by zero!";
          int result = numerator / denominator;
          cout << result;
      } catch (const char *msg) {
          cout << "Error: " << msg;
      }

- Multiple catch blocks can handle different exception types
- The standard exception class (std::exception) and its subclasses

---

## Appendix A: Good Programming Practices

- Write clean, consistently indented code so it is easy to read
- Choose variable and function names that clearly describe their purpose
- Add comments to explain why you wrote something a certain way, not just what it does
- Keep each function focused on one specific task
- Use named constants instead of magic numbers scattered throughout the code
- Test your program with normal input, boundary input (zero, empty, maximum), and invalid input
- Never assume user input is correct; always validate before using it
- Avoid global variables; prefer passing data through function parameters
- Free dynamically allocated memory when you no longer need it

---

## Appendix B: Common C++ Mistakes to Avoid

- Using = (assignment) instead of == (comparison) inside a condition
- Forgetting to initialize a variable before using its value
- Accessing an array element with an index that is out of bounds
- Forgetting a break statement inside a switch case, causing fall-through
- Writing an infinite loop because the loop variable is never updated
- Using new to allocate memory and forgetting to use delete (memory leak)
- Returning a pointer to a local variable that is destroyed when the function ends
- Missing the semicolon after a struct definition closing brace
- Confusing & as address-of operator vs & in a reference declaration
- Calling getline after cin without flushing the leftover newline using cin.ignore()

---

## Appendix C: Recommended Practice Problems

### Beginner Level

- Print Hello, World! on the screen
- Calculate the area and perimeter of a rectangle
- Convert temperature from Celsius to Fahrenheit and back
- Calculate simple interest given principal, rate, and time
- Check if a number is even or odd
- Find the largest of two numbers
- Find the largest of three numbers using if-else
- Check if a character is a vowel or consonant
- Print the multiplication table of a given number from 1 to 10
- Calculate the sum of digits of a number

### Intermediate Level

- Calculate the factorial of a number using a loop
- Calculate factorial using recursion
- Print the Fibonacci series up to N terms
- Check if a number is prime
- Find all prime numbers up to N using the Sieve of Eratosthenes
- Reverse a number and check if it is a palindrome
- Sort an array of N numbers using bubble sort
- Count the frequency of each element in an array
- Perform matrix addition and multiplication
- Check if a string is a palindrome

### Advanced Level

- Implement a stack using an array with push, pop, and peek operations
- Implement a queue using an array
- Create a student record system using structures and file handling
- Implement a singly linked list using pointers with insert and delete
- Create a grade management system using arrays of structures
- Write a program that reads student records from a file, calculates averages, and writes results to a new file
- Build a mini phone book using structures and file handling with search and delete features
