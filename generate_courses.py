from fpdf import FPDF, XPos, YPos
import os

def sanitize(text):
    """Replace characters outside latin-1 range with ASCII equivalents."""
    replacements = {
        '\u2014': '--', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"',  '\u201d': '"', '\u2022': '*', '\u2026': '...',
        '\u00a0': ' ',  '\u2192': '->', '\u2190': '<-', '\u2194': '<->',
        '\u2260': '!=', '\u2264': '<=', '\u2265': '>=', '\u00d7': 'x',
        '\u03bb': 'lambda', '\u03b8': 'theta',
    }
    for ch, rep in replacements.items():
        text = text.replace(ch, rep)
    # Fallback: drop any remaining non-latin-1 characters
    return text.encode('latin-1', errors='replace').decode('latin-1')

# ── Colours ──────────────────────────────────────────────────────────────────
ORANGE      = (246, 139, 60)   # left-bar / section heading accent
HEADING_BG  = (248, 248, 248)
CODE_BG     = (40, 42, 54)
CODE_FG     = (248, 248, 242)
BODY        = (33, 33, 33)
SECTION_CLR = (30, 90, 160)    # section number colour

# ── PDF builder ──────────────────────────────────────────────────────────────
class CoursePDF(FPDF):
    def __init__(self, topic_title):
        super().__init__()
        self.topic_title = topic_title
        self.set_margins(20, 20, 20)
        self.set_auto_page_break(auto=True, margin=22)
        self.add_page()

    # ── Topic title banner ───────────────────────────────────────────────────
    def topic_banner(self):
        # Measure how tall the title will be with multi_cell
        self.set_font('Helvetica', 'B', 17)
        title_text = sanitize(self.topic_title)
        # Orange left bar — height will cover the title area
        bar_x, bar_y = 18, 15
        # Draw text first in a temporary way to measure, then draw bar
        self.set_xy(26, 17)
        self.set_text_color(*BODY)
        # Draw title — multi_cell wraps if needed
        self.multi_cell(164, 10, title_text)
        title_bottom = self.get_y()
        bar_h = max(14, title_bottom - bar_y + 2)
        # Draw orange bar (behind text — PDF draws in order so draw bar,
        # then re-draw text on top)
        self.set_fill_color(*ORANGE)
        self.rect(bar_x, bar_y, 4, bar_h, style='F')
        # Re-draw text on top of bar area
        self.set_xy(26, 17)
        self.set_font('Helvetica', 'B', 17)
        self.set_text_color(*BODY)
        self.multi_cell(164, 10, title_text)
        self.ln(6)

    # ── Section heading (1.1 Style) ───────────────────────────────────────────
    def section(self, title):
        self.ln(5)
        # Ensure section header doesn't orphan at bottom of page
        if self.get_y() > self.page_break_trigger - 20:
            self.add_page()
        self.set_font('Helvetica', 'B', 11.5)
        self.set_text_color(*SECTION_CLR)
        self.multi_cell(0, 7, sanitize(title))
        self.set_text_color(*BODY)
        self.ln(2)

    # ── Bullet point ─────────────────────────────────────────────────────────
    def bullet(self, text):
        self.set_font('Helvetica', '', 10.5)
        self.set_text_color(*BODY)
        text = sanitize(text)

        # Estimate height needed (approx 6mm per line, ~95 chars/line at 165mm width)
        chars_per_line = 90
        estimated_lines = max(1, (len(text) + chars_per_line - 1) // chars_per_line)
        needed_h = estimated_lines * 6 + 3

        if self.get_y() + needed_h > self.page_break_trigger:
            self.add_page()

        y = self.get_y()
        # Bullet dot
        self.set_xy(20, y)
        self.set_font('Helvetica', 'B', 14)
        self.cell(6, 6, chr(149), new_x=XPos.RIGHT, new_y=YPos.TOP)
        # Text — fixed width so it never overflows right margin
        self.set_font('Helvetica', '', 10.5)
        self.set_xy(26, y)
        self.multi_cell(164, 6, text)
        self.ln(1)

    # ── Code block ────────────────────────────────────────────────────────────
    def code(self, lines):
        self.ln(3)
        pad     = 5
        line_h  = 5.2
        box_w   = 170        # total box width
        txt_w   = box_w - pad * 2   # 160mm for text
        max_ch  = 96         # characters that safely fit in txt_w at Courier 9

        # Wrap lines that are too long
        wrapped = []
        for raw in lines:
            raw = sanitize(raw)
            if len(raw) <= max_ch:
                wrapped.append(raw)
            else:
                # hard-wrap preserving indentation
                indent = len(raw) - len(raw.lstrip())
                indent_str = ' ' * min(indent, 8)
                while len(raw) > max_ch:
                    wrapped.append(raw[:max_ch])
                    raw = indent_str + raw[max_ch:].lstrip()
                if raw:
                    wrapped.append(raw)

        total_h = len(wrapped) * line_h + pad * 2

        # If block doesn't fit on current page, start new page
        if self.get_y() + total_h > self.page_break_trigger:
            self.add_page()

        block_y = self.get_y()
        self.set_fill_color(*CODE_BG)
        self.rect(20, block_y, box_w, total_h, style='F')

        self.set_font('Courier', '', 9)
        self.set_text_color(*CODE_FG)
        self.set_xy(20 + pad, block_y + pad)

        for line in wrapped:
            self.set_x(20 + pad)
            # cell with fixed width clips at box boundary
            self.cell(txt_w, line_h, line,
                      new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_text_color(*BODY)
        self.ln(5)

    # ── Divider ───────────────────────────────────────────────────────────────
    def divider(self):
        self.ln(2)
        self.set_draw_color(210, 210, 210)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(4)


# ── Content definition ───────────────────────────────────────────────────────

OOP_TOPICS = [

# ── 01 ────────────────────────────────────────────────────────────────────────
("Topic 1: Review of C++ Basics and Introduction to OOP", [
    ("1.1 Why OOP?", [
        "Procedural programming organises code as a sequence of functions — works for small programs but becomes hard to manage as size grows",
        "OOP (Object-Oriented Programming) organises code around objects that bundle data and the functions that operate on that data",
        "Benefits: code reuse through inheritance, easier maintenance, better modelling of real-world entities",
        "C++ supports both procedural and OOP styles — you choose what suits the problem",
        "The four pillars of OOP: Encapsulation, Abstraction, Inheritance, Polymorphism",
    ], None),
    ("1.2 Quick Review: C++ Fundamentals", [
        "Variables: int age = 20;  double gpa = 3.8;  char grade = 'A';  string name = \"Ali\";",
        "Functions: declared with return type, name, and parameter list — must be defined before use or forward-declared",
        "References: int& ref = x; — an alias for an existing variable, no copy made",
        "Pointers: int* p = &x; — stores address; *p dereferences to the value",
        "Memory regions: stack (local variables, automatic cleanup) and heap (dynamic allocation with new/delete)",
    ], [
        "#include <iostream>",
        "using namespace std;",
        "",
        "int square(int n) { return n * n; }",
        "",
        "int main() {",
        "    int x = 5;",
        "    int& r = x;    // reference",
        "    int* p = &x;   // pointer",
        "    cout << square(x) << endl;",
        "    return 0;",
        "}",
    ]),
    ("1.3 struct vs class — First Look", [
        "struct groups related variables (and optionally functions) under one name",
        "In C++, struct and class are nearly identical — the only difference is default access: struct members are public, class members are private",
        "Use struct for simple data containers; use class when you need encapsulation and behaviour",
    ], [
        "struct Point {",
        "    double x, y;   // public by default",
        "};",
        "",
        "class Circle {",
        "    double radius;  // private by default",
        "public:",
        "    void setRadius(double r) { radius = r; }",
        "    double area() { return 3.14159 * radius * radius; }",
        "};",
    ]),
    ("1.4 Object-Oriented Thinking", [
        "Object: a real-world entity with state (data) and behaviour (functions)",
        "Class: a blueprint that defines what data and functions an object will have",
        "Example: a BankAccount class has state (balance, owner) and behaviour (deposit, withdraw)",
        "Each object created from a class is called an instance",
        "Multiple objects of the same class exist independently — each has its own copy of data members",
    ], None),
]),

# ── 02 ────────────────────────────────────────────────────────────────────────
("Topic 2: Classes and Objects", [
    ("2.1 Defining a Class", [
        "A class definition starts with the keyword class followed by a name and a body in { }",
        "Member variables (attributes) store the state of each object",
        "Member functions (methods) define the behaviour",
        "Access specifiers control visibility: public (accessible anywhere), private (only within the class)",
        "The class definition ends with a semicolon — forgetting it is a common error",
    ], [
        "class Student {",
        "private:",
        "    string name;",
        "    int    rollNo;",
        "    double gpa;",
        "",
        "public:",
        "    void setData(string n, int r, double g);",
        "    void display();",
        "    double getGPA() { return gpa; }  // inline definition",
        "};",
    ]),
    ("2.2 Implementing Member Functions Outside the Class", [
        "Member functions can be defined outside the class body using the scope resolution operator ::",
        "Syntax: ReturnType ClassName::functionName(params) { ... }",
        "Separating declaration (in .h) from definition (in .cpp) keeps code organised in larger projects",
    ], [
        "void Student::setData(string n, int r, double g) {",
        "    name   = n;",
        "    rollNo = r;",
        "    gpa    = g;",
        "}",
        "",
        "void Student::display() {",
        "    cout << \"Name: \" << name",
        "         << \"  Roll: \" << rollNo",
        "         << \"  GPA: \"  << gpa << endl;",
        "}",
    ]),
    ("2.3 Creating and Using Objects", [
        "Objects are created just like variables: ClassName objectName;",
        "Access public members with the dot operator: obj.functionName()",
        "Objects can also be created dynamically on the heap: Student* s = new Student();",
        "For pointer-based objects use arrow operator: s->display();  delete s;",
        "Stack objects are destroyed automatically when they go out of scope",
    ], [
        "int main() {",
        "    Student s1;                          // stack object",
        "    s1.setData(\"Sara\", 101, 3.9);",
        "    s1.display();",
        "",
        "    Student* s2 = new Student();         // heap object",
        "    s2->setData(\"Ahmed\", 102, 3.5);",
        "    s2->display();",
        "    delete s2;",
        "    return 0;",
        "}",
    ]),
    ("2.4 Array of Objects", [
        "An array of objects stores multiple instances: Student arr[3];",
        "Each element is a fully independent object",
        "Access: arr[0].display(); arr[1].setData(...);",
        "Useful for managing collections (e.g., all students in a class)",
    ], None),
]),

# ── 03 ────────────────────────────────────────────────────────────────────────
("Topic 3: Constructors and Destructors", [
    ("3.1 What is a Constructor?", [
        "A constructor is a special member function called automatically when an object is created",
        "Same name as the class, no return type (not even void)",
        "Used to initialise member variables to valid starting values",
        "If you don't write one, the compiler provides a default constructor that does nothing",
    ], [
        "class Rectangle {",
        "    double width, height;",
        "public:",
        "    Rectangle() {           // default constructor",
        "        width = 0; height = 0;",
        "    }",
        "    Rectangle(double w, double h) {  // parameterised constructor",
        "        width = w; height = h;",
        "    }",
        "    double area() { return width * height; }",
        "};",
    ]),
    ("3.2 Constructor Overloading", [
        "You can define multiple constructors with different parameter lists — this is overloading",
        "The compiler calls whichever constructor matches the arguments provided",
        "Default values in parameters can reduce the number of constructors needed",
    ], [
        "Rectangle r1;              // calls default constructor",
        "Rectangle r2(5.0, 3.0);   // calls parameterised constructor",
        "Rectangle r3(4.0);        // works if height has a default value",
    ]),
    ("3.3 Initialiser List", [
        "Preferred way to initialise members: ClassName::ClassName(args) : member(value) { }",
        "Required for const members and reference members — they cannot be assigned in the body",
        "More efficient than assignment inside the body — avoids double initialisation",
    ], [
        "class Point {",
        "    const int x, y;",
        "public:",
        "    Point(int a, int b) : x(a), y(b) {}  // initialiser list",
        "    void show() { cout << x << \", \" << y << endl; }",
        "};",
    ]),
    ("3.4 Copy Constructor", [
        "Called when an object is initialised from another object of the same class",
        "Signature: ClassName(const ClassName& other)",
        "Compiler provides a shallow copy by default — copies values of members",
        "Write your own (deep copy) when the class contains pointers — otherwise both objects share the same heap memory",
    ], [
        "Rectangle r1(6.0, 4.0);",
        "Rectangle r2 = r1;   // copy constructor called",
    ]),
    ("3.5 Destructor", [
        "Called automatically when an object goes out of scope or delete is used on a heap object",
        "Same name as class, prefixed with ~, no parameters, no return type",
        "Release resources: close files, free heap memory allocated in the constructor",
        "If you allocate memory with new in the constructor, always free it with delete in the destructor",
    ], [
        "class Buffer {",
        "    int* data;",
        "public:",
        "    Buffer(int size) { data = new int[size]; }",
        "    ~Buffer()        { delete[] data; }       // destructor",
        "};",
    ]),
]),

# ── 04 ────────────────────────────────────────────────────────────────────────
("Topic 4: Encapsulation and Access Specifiers", [
    ("4.1 The Concept of Encapsulation", [
        "Encapsulation means bundling data and functions that operate on that data inside one class, and hiding internal details from the outside",
        "Protects data from unintended modification — prevents invalid states",
        "Users of the class only need to know what it does, not how it does it (black-box principle)",
        "Achieved in C++ using private data members and public getter/setter functions",
    ], None),
    ("4.2 Access Specifiers", [
        "public: accessible from anywhere — inside the class, derived classes, and outside code",
        "private: accessible only within the class itself — not even derived classes (default for class)",
        "protected: accessible within the class and its derived classes — covered in inheritance",
        "A class can have multiple public and private sections in any order",
    ], [
        "class BankAccount {",
        "private:",
        "    double balance;",
        "    string owner;",
        "",
        "public:",
        "    BankAccount(string o, double b) : owner(o), balance(b) {}",
        "",
        "    void deposit(double amount) {",
        "        if (amount > 0) balance += amount;",
        "    }",
        "    bool withdraw(double amount) {",
        "        if (amount > balance) return false;",
        "        balance -= amount; return true;",
        "    }",
        "    double getBalance() const { return balance; }",
        "};",
    ]),
    ("4.3 Getters and Setters", [
        "Getter (accessor): returns the value of a private member — conventionally named getXxx()",
        "Setter (mutator): sets the value after validation — conventionally named setXxx()",
        "Allows you to add validation logic and change internal representation without breaking external code",
        "Mark getters as const to signal they do not modify the object",
    ], [
        "class Temperature {",
        "    double celsius;",
        "public:",
        "    void setCelsius(double c) {",
        "        if (c < -273.15) return;  // validation",
        "        celsius = c;",
        "    }",
        "    double getCelsius() const { return celsius; }",
        "    double getFahrenheit() const { return celsius * 9/5 + 32; }",
        "};",
    ]),
    ("4.4 const Member Functions", [
        "Declaring a member function const (void show() const) promises it will not modify any data member",
        "Required when calling functions on const objects",
        "Helps catch accidental mutations at compile time — mark every getter as const",
    ], None),
]),

# ── 05 ────────────────────────────────────────────────────────────────────────
("Topic 5: The this Pointer and Static Members", [
    ("5.1 The this Pointer", [
        "Every non-static member function receives an implicit pointer named this pointing to the calling object",
        "Used to disambiguate when a parameter has the same name as a member variable",
        "Used to return the current object from a function (enables method chaining)",
        "Type: ClassName* const this — you can read it but cannot make it point elsewhere",
    ], [
        "class Counter {",
        "    int count;",
        "public:",
        "    Counter(int count) : count(count) {}  // 'this->count' vs parameter 'count'",
        "",
        "    Counter& increment() {",
        "        count++;",
        "        return *this;   // return current object for chaining",
        "    }",
        "    void show() { cout << count << endl; }",
        "};",
        "",
        "// Usage: c.increment().increment().show();",
    ]),
    ("5.2 Static Data Members", [
        "A static data member belongs to the class itself, not to any individual object",
        "Shared by all objects — there is only one copy regardless of how many objects exist",
        "Must be defined outside the class: int ClassName::member = 0;",
        "Use case: counting how many objects have been created",
    ], [
        "class Car {",
        "    static int count;   // declaration inside class",
        "    string model;",
        "public:",
        "    Car(string m) : model(m) { count++; }",
        "    ~Car()                    { count--; }",
        "    static int getCount()     { return count; }",
        "};",
        "",
        "int Car::count = 0;  // definition outside class",
    ]),
    ("5.3 Static Member Functions", [
        "A static member function can be called without creating an object: ClassName::function()",
        "Cannot access non-static members or use this pointer — only static members are in scope",
        "Useful for factory functions, utility helpers, or accessing static counters",
    ], [
        "int main() {",
        "    Car c1(\"Toyota\"); Car c2(\"Honda\");",
        "    cout << Car::getCount() << endl;  // prints 2",
        "}",
    ]),
]),

# ── 06 ────────────────────────────────────────────────────────────────────────
("Topic 6: Operator Overloading", [
    ("6.1 What is Operator Overloading?", [
        "C++ lets you redefine how operators (+, -, *, ==, <<, etc.) work for user-defined classes",
        "Makes class objects behave like built-in types: v1 + v2 instead of v1.add(v2)",
        "Implemented as member functions or global (friend) functions",
        "You cannot change operator precedence or create new operators",
        "Cannot overload: :: (scope), . (dot), .* (pointer to member), ?: (ternary), sizeof",
    ], None),
    ("6.2 Overloading Arithmetic Operators", [
        "Return a new object (by value) — do not modify the operands",
        "As member function: left operand is the calling object (*this), right operand is the parameter",
        "As global friend: both operands are parameters — needed when left operand is not your class",
    ], [
        "class Vector2D {",
        "    double x, y;",
        "public:",
        "    Vector2D(double x=0, double y=0) : x(x), y(y) {}",
        "",
        "    Vector2D operator+(const Vector2D& other) const {",
        "        return Vector2D(x + other.x, y + other.y);",
        "    }",
        "    Vector2D operator*(double scalar) const {",
        "        return Vector2D(x * scalar, y * scalar);",
        "    }",
        "    void print() const { cout << \"(\" << x << \",\" << y << \")\"; }",
        "};",
    ]),
    ("6.3 Overloading Comparison Operators", [
        "Return bool — allows objects to be compared with ==, !=, <, >, etc.",
        "Sort algorithms and standard containers rely on < being defined correctly",
    ], [
        "    bool operator==(const Vector2D& o) const {",
        "        return x == o.x && y == o.y;",
        "    }",
        "    bool operator<(const Vector2D& o) const {",
        "        return (x*x + y*y) < (o.x*o.x + o.y*o.y);  // compare magnitudes",
        "    }",
    ]),
    ("6.4 Overloading Stream Operators", [
        "Overload << to print objects with cout, and >> to read objects with cin",
        "Must be global friend functions because left operand is ostream/istream, not your class",
        "Return the stream by reference so that chaining works: cout << a << b;",
    ], [
        "friend ostream& operator<<(ostream& os, const Vector2D& v) {",
        "    os << \"(\" << v.x << \", \" << v.y << \")\";",
        "    return os;",
        "}",
        "",
        "// Usage: cout << v1 << \" and \" << v2 << endl;",
    ]),
    ("6.5 Overloading the Assignment Operator", [
        "The default assignment (=) does a shallow copy — problematic when the class owns heap memory",
        "Must handle self-assignment (if (this == &other) return *this;)",
        "Free old resources, allocate new ones, copy data, return *this",
    ], None),
]),

# ── 07 ────────────────────────────────────────────────────────────────────────
("Topic 7: Inheritance - Single and Multilevel", [
    ("7.1 What is Inheritance?", [
        "Inheritance allows a new class (derived/child) to acquire properties and behaviour from an existing class (base/parent)",
        "Promotes code reuse — write common logic once in the base class",
        "Models an IS-A relationship: a Dog IS-A Animal, a SavingsAccount IS-A BankAccount",
        "Syntax: class Derived : access-specifier Base { ... };",
        "The most common access specifier is public — derived class inherits public and protected members",
    ], None),
    ("7.2 Single Inheritance", [
        "One derived class inheriting from one base class",
        "Derived class can add new members and override existing ones",
        "Base class members marked protected are accessible in the derived class but not outside",
        "Base class constructor is called before derived class constructor",
    ], [
        "class Animal {",
        "protected:",
        "    string name;",
        "public:",
        "    Animal(string n) : name(n) {}",
        "    void eat() { cout << name << \" is eating\" << endl; }",
        "};",
        "",
        "class Dog : public Animal {",
        "    string breed;",
        "public:",
        "    Dog(string n, string b) : Animal(n), breed(b) {}",
        "    void bark() { cout << name << \" barks!\" << endl; }",
        "};",
    ]),
    ("7.3 Calling Base Class Constructors", [
        "Use the initialiser list to forward arguments to the base constructor",
        "If no base constructor is explicitly called, the default base constructor is invoked",
        "Destructor order is the reverse of constructor order: derived destructor runs first, then base",
    ], [
        "Dog d(\"Rex\", \"Labrador\");",
        "d.eat();    // inherited from Animal",
        "d.bark();   // Dog's own method",
    ]),
    ("7.4 Multilevel Inheritance", [
        "A chain of inheritance: A -> B -> C — B derives from A, C derives from B",
        "C inherits all public/protected members from both A and B",
        "Constructor chain: A() runs first, then B(), then C()",
    ], [
        "class Shape { /* base */ };",
        "class Polygon : public Shape { /* adds sides */ };",
        "class Triangle : public Polygon { /* 3 sides */ };",
    ]),
    ("7.5 Access Specifiers in Inheritance", [
        "public inheritance: public -> public, protected -> protected (most common)",
        "protected inheritance: public -> protected, protected -> protected",
        "private inheritance: public -> private, protected -> private (rarely used)",
        "Private base members are NEVER inherited regardless of access specifier",
    ], None),
]),

# ── 08 ────────────────────────────────────────────────────────────────────────
("Topic 8: Multiple Inheritance and Ambiguity", [
    ("8.1 Multiple Inheritance", [
        "A class can inherit from more than one base class",
        "Syntax: class C : public A, public B { };",
        "C inherits all public and protected members from both A and B",
        "Useful when a class genuinely IS-A combination of two types (e.g., a FlyingCar is both a Car and an Aircraft)",
    ], [
        "class Flyable {",
        "public:",
        "    void fly() { cout << \"Flying\" << endl; }",
        "};",
        "",
        "class Swimmable {",
        "public:",
        "    void swim() { cout << \"Swimming\" << endl; }",
        "};",
        "",
        "class Duck : public Flyable, public Swimmable {",
        "public:",
        "    void quack() { cout << \"Quack!\" << endl; }",
        "};",
    ]),
    ("8.2 Ambiguity in Multiple Inheritance", [
        "Problem: if both base classes define a function with the same name, the compiler cannot decide which to call",
        "Solution: use the scope resolution operator to specify: obj.A::show();",
    ], [
        "class A { public: void show() { cout << \"A\" << endl; } };",
        "class B { public: void show() { cout << \"B\" << endl; } };",
        "class C : public A, public B {};",
        "",
        "C c;",
        "// c.show();       // ERROR: ambiguous",
        "c.A::show();       // OK",
        "c.B::show();       // OK",
    ]),
    ("8.3 The Diamond Problem", [
        "Occurs when two base classes share a common grandparent: A <- B, A <- C, B+C <- D",
        "D would inherit two copies of A's members — one from B's path and one from C's path",
        "Solution: virtual inheritance — class B : virtual public A { };",
        "Virtual base class ensures only one shared copy of A's members exists in D",
    ], [
        "class A { public: int x = 0; };",
        "class B : virtual public A {};",
        "class C : virtual public A {};",
        "class D : public B, public C {};",
        "",
        "D d;",
        "d.x = 5;  // OK — only one copy of x",
    ]),
    ("8.4 When to Use Multiple Inheritance", [
        "Prefer single inheritance + interfaces (abstract classes) over heavy multiple inheritance",
        "Multiple inheritance is suitable when mixing in independent capabilities (logging, serialisation)",
        "Keep multiple-inherited hierarchies shallow to avoid complexity",
    ], None),
]),

# ── 09 ────────────────────────────────────────────────────────────────────────
("Topic 9: Polymorphism and Virtual Functions", [
    ("9.1 What is Polymorphism?", [
        "Polymorphism means 'many forms' — the same function call produces different behaviour depending on the actual object type",
        "Compile-time polymorphism: function overloading, operator overloading (resolved at compile time)",
        "Runtime polymorphism: virtual functions (resolved at runtime through dynamic dispatch)",
        "Runtime polymorphism is the core OOP mechanism that makes extensible designs possible",
    ], None),
    ("9.2 Virtual Functions", [
        "Mark a base class function virtual to allow derived classes to override it",
        "When called through a base class pointer/reference, the correct derived version runs at runtime",
        "Without virtual, calling through a base pointer always calls the base version (static binding)",
        "Add the override keyword in derived classes to catch typos and signature mismatches at compile time",
    ], [
        "class Shape {",
        "public:",
        "    virtual double area() const { return 0; }",
        "    virtual void   draw()  const { cout << \"Drawing shape\" << endl; }",
        "};",
        "",
        "class Circle : public Shape {",
        "    double r;",
        "public:",
        "    Circle(double r) : r(r) {}",
        "    double area()  const override { return 3.14159 * r * r; }",
        "    void   draw()  const override { cout << \"Drawing circle\" << endl; }",
        "};",
        "",
        "class Square : public Shape {",
        "    double s;",
        "public:",
        "    Square(double s) : s(s) {}",
        "    double area()  const override { return s * s; }",
        "    void   draw()  const override { cout << \"Drawing square\" << endl; }",
        "};",
    ]),
    ("9.3 Base Class Pointers and Dynamic Dispatch", [
        "Store derived objects as base class pointers — allows generic processing of different object types",
        "At runtime the vtable (virtual dispatch table) routes the call to the correct override",
        "Always declare the base class destructor virtual when using polymorphism — ensures the correct destructor chain",
    ], [
        "Shape* shapes[] = { new Circle(5), new Square(4), new Circle(3) };",
        "",
        "for (Shape* s : shapes) {",
        "    s->draw();",
        "    cout << \"Area = \" << s->area() << endl;",
        "}",
        "// Each iteration calls the correct override based on actual type",
    ]),
    ("9.4 Virtual Destructor", [
        "Without a virtual destructor, deleting a derived object through a base pointer only calls the base destructor — resource leak",
        "Always declare virtual ~ClassName() {} in any class that has virtual functions",
    ], [
        "class Base { public: virtual ~Base() { cout << \"Base dtor\" << endl; } };",
        "class Derived : public Base { public: ~Derived() { cout << \"Derived dtor\" << endl; } };",
        "",
        "Base* b = new Derived();",
        "delete b;  // prints: Derived dtor, then Base dtor",
    ]),
]),

# ── 10 ────────────────────────────────────────────────────────────────────────
("Topic 10: Abstract Classes and Pure Virtual Functions", [
    ("10.1 Pure Virtual Functions", [
        "A pure virtual function has no definition in the base class: virtual void func() = 0;",
        "Forces every concrete derived class to provide its own implementation",
        "Represents a contract — every Shape must have area(), but Shape itself cannot define it meaningfully",
    ], [
        "class Shape {",
        "public:",
        "    virtual double area()     const = 0;  // pure virtual",
        "    virtual double perimeter() const = 0;  // pure virtual",
        "    virtual ~Shape() {}",
        "};",
    ]),
    ("10.2 Abstract Classes", [
        "A class with at least one pure virtual function is an abstract class",
        "You cannot create objects of an abstract class — it serves only as a base",
        "Abstract classes define an interface that all derived classes must honour",
        "A derived class that does not override all pure virtual functions is also abstract",
    ], [
        "// Shape* s = new Shape(); // ERROR — cannot instantiate abstract class",
        "",
        "class Rectangle : public Shape {",
        "    double w, h;",
        "public:",
        "    Rectangle(double w, double h) : w(w), h(h) {}",
        "    double area()      const override { return w * h; }",
        "    double perimeter() const override { return 2*(w+h); }",
        "};",
    ]),
    ("10.3 Interfaces in C++", [
        "C++ has no interface keyword — interfaces are simulated with pure abstract classes",
        "A pure abstract class has only pure virtual functions and no data members",
        "A class can implement multiple interfaces (mitigates diamond problem since interfaces hold no data)",
    ], [
        "class Printable {",
        "public:",
        "    virtual void print() const = 0;",
        "    virtual ~Printable() {}",
        "};",
        "",
        "class Serializable {",
        "public:",
        "    virtual string toJSON() const = 0;",
        "    virtual ~Serializable() {}",
        "};",
        "",
        "class Report : public Printable, public Serializable {",
        "public:",
        "    void   print()  const override { cout << \"Report\" << endl; }",
        "    string toJSON() const override { return \"{\\\"type\\\":\\\"report\\\"}\"; }",
        "};",
    ]),
    ("10.4 Design Principle: Program to Abstractions", [
        "Write functions that accept base class pointers/references — not concrete types",
        "Code is then open for extension (add new derived classes) without modification",
        "This is the Open/Closed Principle — one of the SOLID design principles",
    ], None),
]),

# ── 11 ────────────────────────────────────────────────────────────────────────
("Topic 11: Friend Functions and Friend Classes", [
    ("11.1 What is a Friend?", [
        "A friend function is a non-member function granted access to private and protected members of a class",
        "Declared inside the class with the friend keyword: friend ReturnType funcName(params);",
        "Friendship is explicitly granted by the class — it is not inherited or transitive",
        "Use sparingly — it breaks strict encapsulation. Prefer public interfaces when possible",
    ], None),
    ("11.2 Friend Functions", [
        "Useful when an operation logically involves two different classes equally",
        "Stream operators (<<, >>) are the most common use case",
        "The friend declaration acts as a prototype — the actual definition is outside the class",
    ], [
        "class Complex {",
        "    double real, imag;",
        "public:",
        "    Complex(double r=0, double i=0) : real(r), imag(i) {}",
        "",
        "    friend Complex operator+(const Complex& a, const Complex& b);",
        "    friend ostream& operator<<(ostream& os, const Complex& c);",
        "};",
        "",
        "Complex operator+(const Complex& a, const Complex& b) {",
        "    return Complex(a.real + b.real, a.imag + b.imag);",
        "}",
        "",
        "ostream& operator<<(ostream& os, const Complex& c) {",
        "    os << c.real << \" + \" << c.imag << \"i\";",
        "    return os;",
        "}",
    ]),
    ("11.3 Friend Classes", [
        "An entire class can be declared a friend: friend class ClassName;",
        "All member functions of the friend class gain access to private members of the granting class",
        "Use case: a LinkedList class granting its Node class access to private fields for efficiency",
    ], [
        "class Engine {",
        "    int horsepower;",
        "    friend class Car;   // Car can access Engine's private members",
        "public:",
        "    Engine(int hp) : horsepower(hp) {}",
        "};",
        "",
        "class Car {",
        "    Engine engine;",
        "public:",
        "    Car(int hp) : engine(hp) {}",
        "    void showPower() { cout << engine.horsepower << \" HP\" << endl; }",
        "};",
    ]),
]),

# ── 12 ────────────────────────────────────────────────────────────────────────
("Topic 12: Templates - Function and Class Templates", [
    ("12.1 Why Templates?", [
        "Without templates, you'd write separate swap functions for int, double, string, etc.",
        "Templates let you write code once and have the compiler generate type-specific versions automatically",
        "This is called generic programming — the algorithm is independent of the data type",
        "The C++ Standard Library (STL) is built entirely on templates",
    ], None),
    ("12.2 Function Templates", [
        "Syntax: template <typename T> ReturnType funcName(T param) { }",
        "typename and class are interchangeable in template parameter lists",
        "The compiler deduces T from the argument type at the call site",
        "You can explicitly specify: swap<double>(a, b);",
    ], [
        "template <typename T>",
        "T maxOf(T a, T b) {",
        "    return (a > b) ? a : b;",
        "}",
        "",
        "template <typename T>",
        "void mySwap(T& a, T& b) {",
        "    T temp = a; a = b; b = temp;",
        "}",
        "",
        "int main() {",
        "    cout << maxOf(3, 7) << endl;       // T = int",
        "    cout << maxOf(3.5, 2.1) << endl;   // T = double",
        "    string s1 = \"hi\", s2 = \"bye\";",
        "    mySwap(s1, s2);",
        "}",
    ]),
    ("12.3 Class Templates", [
        "Define a generic class where the type is a parameter",
        "Instantiate with a specific type: Stack<int>, Stack<string>",
        "All member function definitions outside the class must also carry the template header",
    ], [
        "template <typename T>",
        "class Stack {",
        "    T   data[100];",
        "    int top = -1;",
        "public:",
        "    void push(T val) { data[++top] = val; }",
        "    T    pop()       { return data[top--]; }",
        "    bool empty()     { return top == -1; }",
        "    T    peek()      { return data[top]; }",
        "};",
        "",
        "int main() {",
        "    Stack<int>    intStack;",
        "    Stack<string> strStack;",
        "    intStack.push(10);",
        "    strStack.push(\"hello\");",
        "}",
    ]),
    ("12.4 Template Specialisation", [
        "Provide a custom implementation for a specific type when the generic version won't work correctly",
        "Full specialisation: template <> ReturnType funcName<SpecificType>(params) { }",
        "Example: printing a bool as 'true'/'false' instead of 1/0",
    ], None),
]),

# ── 13 ────────────────────────────────────────────────────────────────────────
("Topic 13: Exception Handling", [
    ("13.1 Why Exception Handling?", [
        "Errors that occur at runtime (file not found, division by zero, bad input) cannot be caught by the compiler",
        "Returning error codes mixes normal and error logic — hard to read and easy to forget to check",
        "Exception handling separates error-detection code from error-handling code cleanly",
        "When an error occurs the program throws an exception; calling code catches it",
    ], None),
    ("13.2 try, throw, catch", [
        "throw: signals that an error has occurred — sends an exception object up the call stack",
        "try block: wraps the code that might throw",
        "catch block: handles a specific type of exception — multiple catch blocks can handle different types",
        "If no catch matches, std::terminate() is called and the program crashes",
    ], [
        "#include <stdexcept>",
        "using namespace std;",
        "",
        "double safeDivide(double a, double b) {",
        "    if (b == 0) throw runtime_error(\"Division by zero\");",
        "    return a / b;",
        "}",
        "",
        "int main() {",
        "    try {",
        "        cout << safeDivide(10, 0) << endl;",
        "    }",
        "    catch (const runtime_error& e) {",
        "        cout << \"Error: \" << e.what() << endl;",
        "    }",
        "    catch (...) {   // catch-all",
        "        cout << \"Unknown error\" << endl;",
        "    }",
        "    return 0;",
        "}",
    ]),
    ("13.3 Standard Exception Classes", [
        "All standard exceptions inherit from std::exception (in <stdexcept>)",
        "runtime_error: errors detectable only at runtime",
        "logic_error: errors due to incorrect program logic (invalid_argument, out_of_range)",
        "bad_alloc: thrown by new when heap memory is exhausted",
        "Call .what() to get the error message string",
    ], None),
    ("13.4 Custom Exception Classes", [
        "Derive from std::exception or std::runtime_error to create domain-specific exceptions",
        "Override what() to provide a descriptive message",
    ], [
        "class InsufficientFundsException : public runtime_error {",
        "    double shortfall;",
        "public:",
        "    InsufficientFundsException(double s)",
        "        : runtime_error(\"Insufficient funds\"), shortfall(s) {}",
        "    double getShortfall() const { return shortfall; }",
        "};",
    ]),
    ("13.5 Stack Unwinding", [
        "When an exception is thrown, C++ automatically destroys local objects in reverse order (RAII)",
        "Destructors run for all stack objects between the throw and the matching catch",
        "This guarantees resource cleanup even when exceptions occur — a crucial safety mechanism",
    ], None),
]),

# ── 14 ────────────────────────────────────────────────────────────────────────
("Topic 14: Standard Template Library (STL)", [
    ("14.1 Overview of the STL", [
        "The STL provides ready-made, generic, highly-optimised data structures and algorithms",
        "Three main components: Containers (store data), Iterators (traverse containers), Algorithms (process data)",
        "All containers work with all algorithms through the iterator abstraction",
        "Using STL saves writing and debugging your own implementations",
    ], None),
    ("14.2 vector", [
        "Dynamic array — size grows automatically as elements are added",
        "Random access in O(1), push_back in amortised O(1)",
        "Prefer vector over raw arrays for most use cases",
    ], [
        "#include <vector>",
        "#include <algorithm>",
        "using namespace std;",
        "",
        "vector<int> v = {5, 2, 8, 1, 9};",
        "v.push_back(4);",
        "sort(v.begin(), v.end());",
        "for (int x : v) cout << x << \" \";   // 1 2 4 5 8 9",
    ]),
    ("14.3 map and unordered_map", [
        "map<K,V>: sorted key-value store (Red-Black Tree) — O(log n) lookup, insert, delete",
        "unordered_map<K,V>: hash table — O(1) average lookup, insert, delete",
        "Use map when you need sorted order; unordered_map for fastest lookups",
    ], [
        "#include <map>",
        "#include <unordered_map>",
        "",
        "map<string, int> scores;",
        "scores[\"Ali\"]  = 95;",
        "scores[\"Sara\"] = 88;",
        "cout << scores[\"Ali\"] << endl;   // 95",
        "",
        "for (auto& [name, score] : scores)",
        "    cout << name << \": \" << score << endl;",
    ]),
    ("14.4 stack, queue, priority_queue", [
        "stack<T>: LIFO — push(), pop(), top()",
        "queue<T>: FIFO — push(), pop(), front()",
        "priority_queue<T>: max-heap by default — top() is always the largest element",
    ], [
        "#include <stack>",
        "#include <queue>",
        "",
        "stack<int> st;  st.push(1); st.push(2); st.pop();   // top = 1",
        "queue<int> q;   q.push(1);  q.push(2);  q.pop();    // front = 2",
    ]),
    ("14.5 Iterators and Algorithms", [
        "Iterator: object that points to an element in a container; ++ moves to the next element",
        "begin() / end(): first element / one-past-last sentinel",
        "Common algorithms: sort, find, count, reverse, accumulate, binary_search, max_element",
    ], [
        "vector<int> v = {3,1,4,1,5,9,2};",
        "auto it = find(v.begin(), v.end(), 5);",
        "if (it != v.end()) cout << \"Found 5 at index \" << it - v.begin();",
        "int sum = accumulate(v.begin(), v.end(), 0);  // 25",
    ]),
]),

# ── 15 ────────────────────────────────────────────────────────────────────────
("Topic 15: OOP Design Principles and Practice Programs", [
    ("15.1 SOLID Principles (Overview)", [
        "S — Single Responsibility: each class should have one reason to change",
        "O — Open/Closed: open for extension, closed for modification (use virtual functions)",
        "L — Liskov Substitution: derived objects must be substitutable for base objects without breaking the program",
        "I — Interface Segregation: prefer many small interfaces over one large one",
        "D — Dependency Inversion: depend on abstractions, not concrete classes",
    ], None),
    ("15.2 Common Design Patterns (Brief)", [
        "Singleton: ensures only one instance exists — private constructor, static getInstance()",
        "Factory Method: creates objects without specifying the exact class — returns base class pointer",
        "Observer: one object (subject) notifies many observers automatically when state changes",
        "Strategy: encapsulates interchangeable algorithms behind a common interface",
    ], [
        "// Singleton example",
        "class Logger {",
        "    Logger() {}",
        "public:",
        "    static Logger& getInstance() {",
        "        static Logger instance;",
        "        return instance;",
        "    }",
        "    void log(const string& msg) { cout << \"[LOG] \" << msg << endl; }",
        "};",
        "",
        "// Usage: Logger::getInstance().log(\"App started\");",
    ]),
    ("15.3 Practice Program — Library Management System", [
        "Classes: Book, Member, Library",
        "Book: title, author, ISBN, isAvailable",
        "Member: name, memberId, list of borrowed books",
        "Library: collection of books and members, borrowBook(), returnBook(), searchBook()",
        "Apply encapsulation, inheritance (PremiumMember : Member), polymorphism (virtual canBorrow())",
    ], [
        "class Book {",
        "    string title, author, isbn;",
        "    bool   isAvailable = true;",
        "public:",
        "    Book(string t, string a, string i) : title(t), author(a), isbn(i) {}",
        "    bool available()          { return isAvailable; }",
        "    void checkout()           { isAvailable = false; }",
        "    void checkin()            { isAvailable = true;  }",
        "    string getTitle()         { return title; }",
        "};",
    ]),
    ("15.4 Practice Program — Shape Hierarchy", [
        "Abstract base: Shape with pure virtual area() and perimeter()",
        "Derived: Circle, Rectangle, Triangle, Square",
        "Store all shapes in a vector<Shape*> and compute total area",
        "Add a printAll() free function that works for any future shape without modification",
    ], [
        "vector<Shape*> shapes;",
        "shapes.push_back(new Circle(5));",
        "shapes.push_back(new Rectangle(4, 6));",
        "shapes.push_back(new Triangle(3, 4, 5, 6));",
        "",
        "double total = 0;",
        "for (Shape* s : shapes) { s->draw(); total += s->area(); }",
        "cout << \"Total area: \" << total << endl;",
        "",
        "for (Shape* s : shapes) delete s;",
    ]),
]),

]  # end OOP_TOPICS

# ─────────────────────────────────────────────────────────────────────────────
DS_TOPICS = [

# ── 01 ────────────────────────────────────────────────────────────────────────
("Topic 1: Introduction to Data Structures and Algorithm Analysis", [
    ("1.1 What is a Data Structure?", [
        "A data structure is a way of organising, storing, and managing data so that it can be accessed and modified efficiently",
        "Choice of data structure directly affects the performance of algorithms",
        "Examples: arrays, linked lists, stacks, queues, trees, graphs, hash tables",
        "No single data structure is best for every problem — pick based on operations needed",
    ], None),
    ("1.2 Abstract Data Types (ADT)", [
        "An ADT defines what operations a data structure supports, not how they are implemented",
        "Example: a Stack ADT supports push, pop, peek, isEmpty — the internal storage (array or linked list) is an implementation detail",
        "ADTs enable programming to interfaces — you can swap implementations without changing calling code",
    ], None),
    ("1.3 Algorithm Analysis and Big-O Notation", [
        "Big-O notation describes the growth rate of time or space as input size n increases",
        "O(1)  — constant: array index access",
        "O(log n) — logarithmic: binary search",
        "O(n)  — linear: sequential scan",
        "O(n log n) — sorting with divide and conquer: merge sort, heap sort",
        "O(n^2) — quadratic: nested loops, bubble sort, selection sort",
        "O(2^n) — exponential: naive recursive solutions",
        "We analyse worst-case complexity unless stated otherwise",
    ], None),
    ("1.4 Space Complexity", [
        "Memory used by an algorithm as a function of input size",
        "Includes memory for variables, call stack (recursion), and auxiliary structures",
        "In-place algorithms use O(1) extra space (insertion sort); merge sort uses O(n) extra space",
        "Sometimes trade space for time: hash tables use extra memory for O(1) lookups",
    ], None),
]),

# ── 02 ────────────────────────────────────────────────────────────────────────
("Topic 2: Arrays and Dynamic Memory", [
    ("2.1 Static Arrays", [
        "Declared with a fixed size known at compile time: int arr[10];",
        "Stored in contiguous memory — index access is O(1): arr[i] = base_address + i * sizeof(int)",
        "Size cannot change after declaration — wasted space if too large, overflow if too small",
        "Pass to functions as a pointer: void func(int* arr, int size)",
    ], [
        "#include <iostream>",
        "using namespace std;",
        "",
        "void printArray(int* arr, int n) {",
        "    for (int i = 0; i < n; i++) cout << arr[i] << \" \";",
        "    cout << endl;",
        "}",
        "",
        "int main() {",
        "    int a[5] = {10, 20, 30, 40, 50};",
        "    printArray(a, 5);",
        "}",
    ]),
    ("2.2 Dynamic Arrays with new / delete", [
        "Allocate on the heap when size is not known at compile time",
        "int* arr = new int[n]; — allocates n integers on the heap",
        "Always delete[] arr; when done to avoid memory leaks",
        "Resize requires: allocate larger array, copy old data, delete old array",
    ], [
        "int n;  cin >> n;",
        "int* arr = new int[n];",
        "for (int i = 0; i < n; i++) arr[i] = i * 2;",
        "",
        "// Resize to 2n",
        "int* bigger = new int[2*n];",
        "for (int i = 0; i < n; i++) bigger[i] = arr[i];",
        "delete[] arr;",
        "arr = bigger;",
        "// ... later ...",
        "delete[] arr;",
    ]),
    ("2.3 2D Arrays and Dynamic 2D Arrays", [
        "Static 2D: int matrix[3][4]; — stored row-major in contiguous memory",
        "Dynamic 2D: array of pointers, each pointing to a dynamically allocated row",
        "Useful when rows have different lengths (jagged arrays)",
    ], [
        "int rows = 3, cols = 4;",
        "int** mat = new int*[rows];",
        "for (int i = 0; i < rows; i++) mat[i] = new int[cols];",
        "",
        "mat[1][2] = 99;",
        "",
        "for (int i = 0; i < rows; i++) delete[] mat[i];",
        "delete[] mat;",
    ]),
    ("2.4 std::vector as a Dynamic Array", [
        "vector<int> grows automatically — no manual memory management",
        "push_back: O(1) amortised — occasionally doubles capacity",
        "size() vs capacity(): size is elements stored; capacity is allocated space",
        "reserve(n): pre-allocate n slots to avoid repeated reallocation",
    ], None),
]),

# ── 03 ────────────────────────────────────────────────────────────────────────
("Topic 3: Singly Linked List", [
    ("3.1 What is a Linked List?", [
        "A sequence of nodes where each node stores data and a pointer to the next node",
        "Nodes are NOT in contiguous memory — scattered on the heap, linked by pointers",
        "Advantages over arrays: O(1) insert/delete at known position, no pre-declared size",
        "Disadvantages: O(n) random access (must traverse from head), extra memory for pointers",
    ], None),
    ("3.2 Node Structure", [
        "Each node has two fields: data (payload) and next (pointer to the next node)",
        "The last node's next is nullptr — marks the end of the list",
        "head pointer: points to the first node; if head == nullptr the list is empty",
    ], [
        "struct Node {",
        "    int   data;",
        "    Node* next;",
        "    Node(int d) : data(d), next(nullptr) {}",
        "};",
    ]),
    ("3.3 Core Operations", [
        "insertFront: create node, set node->next = head, set head = node — O(1)",
        "insertEnd: traverse to last node, set last->next = newNode — O(n)",
        "deleteNode(val): find node with val, update previous node's next to skip it, delete node — O(n)",
        "search(val): traverse from head until data == val or nullptr — O(n)",
        "printList: traverse from head, print each node's data — O(n)",
    ], [
        "class LinkedList {",
        "    Node* head = nullptr;",
        "public:",
        "    void insertFront(int d) {",
        "        Node* n = new Node(d);",
        "        n->next = head;",
        "        head = n;",
        "    }",
        "    void insertEnd(int d) {",
        "        Node* n = new Node(d);",
        "        if (!head) { head = n; return; }",
        "        Node* cur = head;",
        "        while (cur->next) cur = cur->next;",
        "        cur->next = n;",
        "    }",
        "    void print() {",
        "        for (Node* cur = head; cur; cur = cur->next)",
        "            cout << cur->data << \" -> \";",
        "        cout << \"NULL\" << endl;",
        "    }",
        "};",
    ]),
    ("3.4 Reversing a Linked List", [
        "Three pointers: prev (nullptr), curr (head), next",
        "Iteration: save next = curr->next, reverse link curr->next = prev, advance prev = curr, curr = next",
        "After loop, head = prev",
        "Time: O(n), Space: O(1)",
    ], [
        "void reverse() {",
        "    Node *prev = nullptr, *curr = head, *next = nullptr;",
        "    while (curr) {",
        "        next       = curr->next;",
        "        curr->next = prev;",
        "        prev       = curr;",
        "        curr       = next;",
        "    }",
        "    head = prev;",
        "}",
    ]),
]),

# ── 04 ────────────────────────────────────────────────────────────────────────
("Topic 4: Doubly and Circular Linked Lists", [
    ("4.1 Doubly Linked List", [
        "Each node has two pointers: next (forward) and prev (backward)",
        "Allows traversal in both directions — bidirectional iteration",
        "O(1) deletion when you have a pointer to the node itself (no need to find previous node)",
        "More memory per node than singly linked list",
    ], [
        "struct DNode {",
        "    int    data;",
        "    DNode* next;",
        "    DNode* prev;",
        "    DNode(int d) : data(d), next(nullptr), prev(nullptr) {}",
        "};",
    ]),
    ("4.2 DLL Insert at Front and End", [
        "insertFront: new node's next = head; if head exists set head->prev = new node; head = new node",
        "insertEnd: traverse to tail; tail->next = new node; new node->prev = tail; tail = new node",
        "Maintaining a tail pointer makes insertEnd O(1) instead of O(n)",
    ], [
        "void insertFront(int d) {",
        "    DNode* n = new DNode(d);",
        "    n->next = head;",
        "    if (head) head->prev = n;",
        "    head = n;",
        "}",
    ]),
    ("4.3 DLL Delete a Node", [
        "If node->prev exists: node->prev->next = node->next",
        "If node->next exists: node->next->prev = node->prev",
        "If deleting head: update head = head->next",
        "delete node",
    ], None),
    ("4.4 Circular Linked List", [
        "The last node's next points back to the head instead of nullptr",
        "Useful for round-robin scheduling, music playlist looping",
        "Singly circular: only next pointers form a cycle",
        "Doubly circular: both next and prev pointers form cycles",
        "Traversal must check for cycle: stop when current->next == head",
    ], [
        "// Insert in singly circular list",
        "void insertEnd(int d) {",
        "    Node* n = new Node(d);",
        "    if (!head) { head = n; n->next = head; return; }",
        "    Node* cur = head;",
        "    while (cur->next != head) cur = cur->next;",
        "    cur->next = n;",
        "    n->next   = head;",
        "}",
    ]),
]),

# ── 05 ────────────────────────────────────────────────────────────────────────
("Topic 5: Stacks", [
    ("5.1 Stack ADT", [
        "A Stack is a Last-In First-Out (LIFO) data structure",
        "Operations: push (add to top), pop (remove from top), peek/top (view top without removing), isEmpty",
        "Real-world analogies: stack of plates, function call stack, undo history",
        "All operations are O(1)",
    ], None),
    ("5.2 Array-Based Stack", [
        "Use a fixed array and an integer top (initially -1)",
        "push: check overflow (top == MAX-1), then data[++top] = val",
        "pop: check underflow (top == -1), then return data[top--]",
        "Simple but limited to a fixed capacity",
    ], [
        "class ArrayStack {",
        "    int data[100], top = -1;",
        "public:",
        "    void push(int v) {",
        "        if (top == 99) { cout << \"Overflow\"; return; }",
        "        data[++top] = v;",
        "    }",
        "    int  pop()   { return (top==-1) ? -1 : data[top--]; }",
        "    int  peek()  { return data[top]; }",
        "    bool empty() { return top == -1; }",
        "};",
    ]),
    ("5.3 Linked-List-Based Stack", [
        "Push: insert new node at front of linked list — O(1)",
        "Pop: remove front node — O(1)",
        "No capacity limit — grows as needed",
    ], [
        "class LinkedStack {",
        "    Node* top = nullptr;",
        "public:",
        "    void push(int v) { Node* n = new Node(v); n->next = top; top = n; }",
        "    int  pop()  { int v = top->data; Node* t = top; top = top->next; delete t; return v; }",
        "    int  peek() { return top->data; }",
        "    bool empty(){ return top == nullptr; }",
        "};",
    ]),
    ("5.4 Applications of Stacks", [
        "Balanced parentheses checking: push ( ; pop and match for ) — if stack empty at end, balanced",
        "Expression evaluation: postfix (Reverse Polish Notation) evaluation using a stack",
        "Infix to postfix conversion (Shunting-Yard algorithm)",
        "Function call stack: each call pushes a frame; return pops it",
        "Depth-First Search (DFS) — uses a stack (either explicit or the call stack via recursion)",
    ], [
        "bool isBalanced(string expr) {",
        "    stack<char> s;",
        "    for (char c : expr) {",
        "        if (c=='(' || c=='{' || c=='[') s.push(c);",
        "        else if (c==')' || c=='}' || c==']') {",
        "            if (s.empty()) return false;",
        "            s.pop();",
        "        }",
        "    }",
        "    return s.empty();",
        "}",
    ]),
]),

# ── 06 ────────────────────────────────────────────────────────────────────────
("Topic 6: Queues and Deques", [
    ("6.1 Queue ADT", [
        "A Queue is a First-In First-Out (FIFO) data structure",
        "Operations: enqueue (add to rear), dequeue (remove from front), front (view front), isEmpty",
        "Analogies: ticket queue, print spooler, BFS traversal",
        "All operations are O(1)",
    ], None),
    ("6.2 Array-Based Circular Queue", [
        "Use a fixed array with front and rear indices and a count",
        "Wrap around using modulo: rear = (rear + 1) % capacity",
        "Avoids the 'shifting' problem of a naive linear array queue",
    ], [
        "class CircularQueue {",
        "    int data[10], front=0, rear=-1, count=0;",
        "    const int CAP = 10;",
        "public:",
        "    void enqueue(int v) {",
        "        if (count == CAP) { cout << \"Full\"; return; }",
        "        rear = (rear + 1) % CAP;",
        "        data[rear] = v; count++;",
        "    }",
        "    int dequeue() {",
        "        if (count == 0) return -1;",
        "        int v = data[front];",
        "        front = (front + 1) % CAP; count--;",
        "        return v;",
        "    }",
        "};",
    ]),
    ("6.3 Linked-List-Based Queue", [
        "Maintain head (front) and tail (rear) pointers",
        "Enqueue: add node at tail — O(1)",
        "Dequeue: remove node from head — O(1)",
        "No capacity limit",
    ], None),
    ("6.4 Priority Queue", [
        "Elements are dequeued in priority order, not arrival order",
        "Implementation: binary heap (standard) or sorted array",
        "std::priority_queue<int>: max-heap by default — top() is always the largest",
        "Min-heap: priority_queue<int, vector<int>, greater<int>>",
        "Used in Dijkstra's shortest path, task scheduling, Huffman coding",
    ], [
        "#include <queue>",
        "priority_queue<int> maxH;",
        "maxH.push(3); maxH.push(1); maxH.push(9);",
        "cout << maxH.top();  // 9",
    ]),
    ("6.5 Deque (Double-Ended Queue)", [
        "Supports insert and delete at both front and rear in O(1)",
        "std::deque<T> in the STL",
        "push_front, push_back, pop_front, pop_back",
        "Used to implement sliding window maximum, palindrome checking",
    ], None),
]),

# ── 07 ────────────────────────────────────────────────────────────────────────
("Topic 7: Recursion", [
    ("7.1 What is Recursion?", [
        "A function that calls itself to solve a smaller version of the same problem",
        "Every recursive solution needs: a base case (terminates recursion) and a recursive case",
        "Each call pushes a new stack frame — too many calls causes stack overflow",
        "Many problems have elegant recursive solutions: tree traversal, divide-and-conquer",
    ], None),
    ("7.2 Classic Examples", [
        "Factorial: fact(n) = n * fact(n-1);  base: fact(0) = 1",
        "Fibonacci: fib(n) = fib(n-1) + fib(n-2);  base: fib(0)=0, fib(1)=1",
        "Binary search: compare mid; recurse on left or right half",
        "Note: naive Fibonacci is O(2^n) — memoisation reduces it to O(n)",
    ], [
        "int factorial(int n) {",
        "    if (n == 0) return 1;          // base case",
        "    return n * factorial(n - 1);   // recursive case",
        "}",
        "",
        "int fibonacci(int n) {",
        "    if (n <= 1) return n;",
        "    return fibonacci(n-1) + fibonacci(n-2);",
        "}",
    ]),
    ("7.3 Recursion vs Iteration", [
        "Any recursive algorithm can be converted to iterative (using an explicit stack)",
        "Recursion is cleaner for tree/graph traversal, divide-and-conquer",
        "Iteration is more memory-efficient (no stack frame overhead)",
        "Tail recursion: recursive call is the last thing done — compiler can optimise to iteration",
    ], None),
    ("7.4 Divide and Conquer", [
        "Divide the problem into smaller sub-problems of the same type",
        "Conquer: solve sub-problems recursively",
        "Combine: merge sub-problem results",
        "Examples: merge sort, quick sort, binary search",
        "Recurrence relation for merge sort: T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem",
    ], [
        "void mergeSort(int* a, int l, int r) {",
        "    if (l >= r) return;",
        "    int mid = (l + r) / 2;",
        "    mergeSort(a, l, mid);",
        "    mergeSort(a, mid+1, r);",
        "    merge(a, l, mid, r);    // combine step",
        "}",
    ]),
]),

# ── 08 ────────────────────────────────────────────────────────────────────────
("Topic 8: Trees and Binary Trees", [
    ("8.1 Tree Terminology", [
        "Tree: hierarchical data structure with a root node and sub-trees of children",
        "Root: top node with no parent",
        "Leaf: node with no children",
        "Height of tree: longest path from root to a leaf (in edges)",
        "Depth of node: number of edges from root to that node",
        "Degree of node: number of children",
        "Binary tree: every node has at most 2 children (left and right)",
    ], None),
    ("8.2 Binary Tree Node", [
        "Struct with data, left child pointer, right child pointer",
        "Left and right pointers are nullptr for leaf nodes",
    ], [
        "struct TreeNode {",
        "    int       data;",
        "    TreeNode* left;",
        "    TreeNode* right;",
        "    TreeNode(int d) : data(d), left(nullptr), right(nullptr) {}",
        "};",
    ]),
    ("8.3 Tree Traversals", [
        "Inorder (Left, Root, Right): produces sorted sequence for a BST",
        "Preorder (Root, Left, Right): copies a tree; used in expression trees",
        "Postorder (Left, Right, Root): deletes a tree; evaluates expression trees",
        "Level-order (BFS): visit level by level using a queue",
    ], [
        "void inorder(TreeNode* root) {",
        "    if (!root) return;",
        "    inorder(root->left);",
        "    cout << root->data << \" \";",
        "    inorder(root->right);",
        "}",
        "",
        "void preorder(TreeNode* root) {",
        "    if (!root) return;",
        "    cout << root->data << \" \";",
        "    preorder(root->left);",
        "    preorder(root->right);",
        "}",
    ]),
    ("8.4 Properties of Binary Trees", [
        "Full binary tree: every node has 0 or 2 children",
        "Complete binary tree: all levels filled except possibly the last, which is filled left to right",
        "Perfect binary tree: all internal nodes have 2 children, all leaves at the same depth",
        "A perfect binary tree of height h has 2^(h+1) - 1 nodes",
        "Skewed tree (worst case): degenerates to a linked list — O(n) operations instead of O(log n)",
    ], None),
]),

# ── 09 ────────────────────────────────────────────────────────────────────────
("Topic 9: Binary Search Trees", [
    ("9.1 BST Property", [
        "For every node N: all values in the left subtree < N.data; all values in the right subtree > N.data",
        "This ordering property enables O(log n) search, insert, and delete for balanced trees",
        "Inorder traversal of a BST always yields elements in sorted order",
    ], None),
    ("9.2 BST Search and Insert", [
        "Search: compare target with root — go left if smaller, right if larger, stop if equal or null",
        "Insert: perform search until nullptr is reached, then create a new node at that position",
        "Both O(log n) average, O(n) worst case (skewed tree)",
    ], [
        "TreeNode* insert(TreeNode* root, int val) {",
        "    if (!root) return new TreeNode(val);",
        "    if (val < root->data) root->left  = insert(root->left, val);",
        "    else if (val > root->data) root->right = insert(root->right, val);",
        "    return root;",
        "}",
        "",
        "TreeNode* search(TreeNode* root, int val) {",
        "    if (!root || root->data == val) return root;",
        "    if (val < root->data) return search(root->left, val);",
        "    return search(root->right, val);",
        "}",
    ]),
    ("9.3 BST Deletion", [
        "Case 1: Leaf node — simply delete it",
        "Case 2: Node with one child — replace node with its child",
        "Case 3: Node with two children — replace data with inorder successor (smallest in right subtree), then delete the successor",
    ], [
        "TreeNode* minNode(TreeNode* n) {",
        "    while (n->left) n = n->left;",
        "    return n;",
        "}",
        "",
        "TreeNode* deleteNode(TreeNode* root, int val) {",
        "    if (!root) return root;",
        "    if      (val < root->data) root->left  = deleteNode(root->left, val);",
        "    else if (val > root->data) root->right = deleteNode(root->right, val);",
        "    else {",
        "        if (!root->left)  { TreeNode* t = root->right; delete root; return t; }",
        "        if (!root->right) { TreeNode* t = root->left;  delete root; return t; }",
        "        TreeNode* succ = minNode(root->right);",
        "        root->data  = succ->data;",
        "        root->right = deleteNode(root->right, succ->data);",
        "    }",
        "    return root;",
        "}",
    ]),
]),

# ── 10 ────────────────────────────────────────────────────────────────────────
("Topic 10: AVL Trees and Balancing", [
    ("10.1 The Problem with Unbalanced BSTs", [
        "Inserting sorted data (1,2,3,...) into a BST creates a right-skewed tree — O(n) all operations",
        "Need self-balancing trees to guarantee O(log n) height",
        "AVL tree (Adelson-Velsky and Landis, 1962): first self-balancing BST",
        "Balance Factor of a node = height(left subtree) - height(right subtree)",
        "AVL property: balance factor must be -1, 0, or +1 for every node",
    ], None),
    ("10.2 AVL Rotations", [
        "When an insertion violates the AVL property, rotations restore balance",
        "Right Rotation (LL case): unbalanced right-right — rotate left-heavy subtree clockwise",
        "Left Rotation (RR case): rotate right-heavy subtree counter-clockwise",
        "Left-Right Rotation (LR case): left rotation on left child, then right rotation on node",
        "Right-Left Rotation (RL case): right rotation on right child, then left rotation on node",
    ], [
        "TreeNode* rotateRight(TreeNode* y) {",
        "    TreeNode* x  = y->left;",
        "    TreeNode* T2 = x->right;",
        "    x->right = y;",
        "    y->left  = T2;",
        "    // update heights ...",
        "    return x;",
        "}",
        "",
        "TreeNode* rotateLeft(TreeNode* x) {",
        "    TreeNode* y  = x->right;",
        "    TreeNode* T2 = y->left;",
        "    y->left  = x;",
        "    x->right = T2;",
        "    return y;",
        "}",
    ]),
    ("10.3 AVL Insert Overview", [
        "Perform standard BST insert",
        "Update height of current node: 1 + max(height(left), height(right))",
        "Compute balance factor",
        "Apply appropriate rotation if balance factor falls outside [-1, 1]",
        "Guaranteed O(log n) height — at most O(log n) rotations per insertion",
    ], None),
    ("10.4 Other Balanced BSTs", [
        "Red-Black Tree: looser balance guarantee, faster insertions — used in std::map and std::set",
        "B-Tree: self-balancing for disk storage — used in databases and file systems",
        "Splay Tree: recently accessed elements are faster to access next time",
    ], None),
]),

# ── 11 ────────────────────────────────────────────────────────────────────────
("Topic 11: Heaps and Priority Queues", [
    ("11.1 Heap Properties", [
        "A complete binary tree stored efficiently as an array",
        "Max-Heap: every parent >= its children — root is the maximum element",
        "Min-Heap: every parent <= its children — root is the minimum element",
        "For node at index i: left child at 2i+1, right child at 2i+2, parent at (i-1)/2",
    ], None),
    ("11.2 Heap Operations", [
        "Insert (push): add element at the end, then sift up (swap with parent while parent smaller)",
        "Extract-Max/Min (pop): swap root with last element, reduce size, sift down (swap with larger child)",
        "Both insert and extract are O(log n)",
        "Build heap from unsorted array: O(n) — start sifting down from last internal node",
    ], [
        "class MaxHeap {",
        "    vector<int> h;",
        "    void siftUp(int i) {",
        "        while (i>0 && h[(i-1)/2] < h[i]) {",
        "            swap(h[i], h[(i-1)/2]); i = (i-1)/2;",
        "        }",
        "    }",
        "    void siftDown(int i) {",
        "        int n = h.size();",
        "        while (2*i+1 < n) {",
        "            int big = 2*i+1;",
        "            if (2*i+2 < n && h[2*i+2] > h[big]) big = 2*i+2;",
        "            if (h[i] >= h[big]) break;",
        "            swap(h[i], h[big]); i = big;",
        "        }",
        "    }",
        "public:",
        "    void push(int v) { h.push_back(v); siftUp(h.size()-1); }",
        "    int  top()       { return h[0]; }",
        "    void pop()       { h[0]=h.back(); h.pop_back(); siftDown(0); }",
        "};",
    ]),
    ("11.3 Heap Sort", [
        "Build a max-heap from the array in O(n)",
        "Repeatedly extract the max and place at the end: O(n log n) total",
        "In-place and O(n log n) worst-case — but poor cache performance compared to quicksort",
    ], None),
    ("11.4 STL Priority Queue", [
        "std::priority_queue<int>: max-heap",
        "push(), pop(), top(), empty(), size()",
        "Custom comparator for min-heap: priority_queue<int, vector<int>, greater<int>>",
        "Applications: Dijkstra's algorithm, A* search, task scheduling, K largest elements",
    ], None),
]),

# ── 12 ────────────────────────────────────────────────────────────────────────
("Topic 12: Hashing and Hash Tables", [
    ("12.1 What is Hashing?", [
        "A technique to map a key to an array index using a hash function",
        "Goal: O(1) average time for insert, search, and delete",
        "Hash function h(key) should distribute keys uniformly across the table",
        "A simple hash: index = key % tableSize",
        "Good hash functions minimise collisions (two keys mapping to the same index)",
    ], None),
    ("12.2 Collision Resolution - Chaining", [
        "Each array slot holds a linked list of all keys that hash to that index",
        "Insert: compute h(key), append to the list at that index — O(1) average",
        "Search: compute h(key), search the list — O(1) average, O(n) worst (all keys in one chain)",
        "Load factor λ = n/m (n=keys, m=table size) — keep λ < 1 for good performance",
    ], [
        "class HashTable {",
        "    vector<list<int>> table;",
        "    int size;",
        "    int hash(int key) { return key % size; }",
        "public:",
        "    HashTable(int s) : size(s), table(s) {}",
        "    void insert(int key) { table[hash(key)].push_back(key); }",
        "    bool search(int key) {",
        "        for (int k : table[hash(key)])",
        "            if (k == key) return true;",
        "        return false;",
        "    }",
        "};",
    ]),
    ("12.3 Collision Resolution - Open Addressing", [
        "All keys stored directly in the array — no linked lists",
        "Linear probing: on collision, try next slot (index+1, index+2, ...) — causes clustering",
        "Quadratic probing: try index+1^2, index+2^2, ... — reduces clustering",
        "Double hashing: use a second hash function for the step size — best distribution",
    ], None),
    ("12.4 STL Unordered Containers", [
        "unordered_map<K,V>: hash table — O(1) average lookup, insert, delete",
        "unordered_set<T>: hash set — O(1) average contains, insert, delete",
        "Load factor managed automatically — rehashes when λ > 1",
        "Custom hash for user-defined types: provide a hash<T> specialisation",
    ], None),
]),

# ── 13 ────────────────────────────────────────────────────────────────────────
("Topic 13: Graphs and Graph Traversal", [
    ("13.1 Graph Terminology", [
        "Graph G = (V, E): set of vertices V connected by edges E",
        "Directed graph: edges have direction (A -> B does not imply B -> A)",
        "Undirected graph: edges are bidirectional",
        "Weighted graph: each edge has a numerical weight",
        "Path: sequence of vertices connected by edges",
        "Cycle: path that starts and ends at the same vertex",
        "Connected: every vertex reachable from every other vertex (undirected)",
    ], None),
    ("13.2 Graph Representations", [
        "Adjacency Matrix: V×V 2D array — matrix[u][v]=1 if edge exists — O(V^2) space",
        "Adjacency List: array of lists — list[u] contains all neighbours of u — O(V+E) space",
        "Adjacency list preferred for sparse graphs; matrix for dense graphs or O(1) edge queries",
    ], [
        "// Adjacency list using vector of vectors",
        "int V = 5;",
        "vector<vector<int>> adj(V);",
        "",
        "// Add undirected edge between u and v",
        "void addEdge(int u, int v) {",
        "    adj[u].push_back(v);",
        "    adj[v].push_back(u);",
        "}",
    ]),
    ("13.3 Breadth-First Search (BFS)", [
        "Visit all neighbours of a vertex before going deeper — level by level",
        "Use a queue and a visited array",
        "Time: O(V+E), Space: O(V)",
        "Applications: shortest path in unweighted graph, level-order tree traversal, connected components",
    ], [
        "void BFS(int start) {",
        "    vector<bool> visited(V, false);",
        "    queue<int> q;",
        "    visited[start] = true;",
        "    q.push(start);",
        "    while (!q.empty()) {",
        "        int v = q.front(); q.pop();",
        "        cout << v << \" \";",
        "        for (int u : adj[v])",
        "            if (!visited[u]) { visited[u]=true; q.push(u); }",
        "    }",
        "}",
    ]),
    ("13.4 Depth-First Search (DFS)", [
        "Explore as far as possible along each branch before backtracking",
        "Use recursion (implicit stack) or an explicit stack",
        "Time: O(V+E), Space: O(V)",
        "Applications: cycle detection, topological sort, connected components, maze solving",
    ], [
        "vector<bool> visited(V, false);",
        "",
        "void DFS(int v) {",
        "    visited[v] = true;",
        "    cout << v << \" \";",
        "    for (int u : adj[v])",
        "        if (!visited[u]) DFS(u);",
        "}",
    ]),
]),

# ── 14 ────────────────────────────────────────────────────────────────────────
("Topic 14: Sorting Algorithms", [
    ("14.1 Bubble Sort", [
        "Compare adjacent elements and swap if out of order — largest bubbles to the end each pass",
        "Time: O(n^2) worst and average, O(n) best (already sorted with early-exit flag)",
        "Space: O(1) in-place",
        "Stable sort — preserves relative order of equal elements",
    ], [
        "void bubbleSort(int* a, int n) {",
        "    for (int i = 0; i < n-1; i++) {",
        "        bool swapped = false;",
        "        for (int j = 0; j < n-1-i; j++)",
        "            if (a[j] > a[j+1]) { swap(a[j], a[j+1]); swapped = true; }",
        "        if (!swapped) break;  // already sorted",
        "    }",
        "}",
    ]),
    ("14.2 Selection Sort", [
        "Find minimum in unsorted region, swap with first unsorted element — repeat",
        "Time: O(n^2) always — never benefits from partially sorted input",
        "Minimises number of swaps — O(n) swaps total",
    ], [
        "void selectionSort(int* a, int n) {",
        "    for (int i = 0; i < n-1; i++) {",
        "        int minIdx = i;",
        "        for (int j = i+1; j < n; j++)",
        "            if (a[j] < a[minIdx]) minIdx = j;",
        "        swap(a[i], a[minIdx]);",
        "    }",
        "}",
    ]),
    ("14.3 Insertion Sort", [
        "Build sorted portion one element at a time — shift elements right to make room",
        "Time: O(n^2) worst, O(n) best (already sorted) — excellent for small or nearly sorted arrays",
        "Stable, in-place, online (can sort as elements arrive)",
    ], [
        "void insertionSort(int* a, int n) {",
        "    for (int i = 1; i < n; i++) {",
        "        int key = a[i], j = i-1;",
        "        while (j >= 0 && a[j] > key) { a[j+1] = a[j]; j--; }",
        "        a[j+1] = key;",
        "    }",
        "}",
    ]),
    ("14.4 Merge Sort", [
        "Divide array in half, recursively sort each half, merge sorted halves",
        "Time: O(n log n) always — consistent performance",
        "Space: O(n) extra — requires auxiliary array during merge",
        "Stable sort — preferred when stability matters",
    ], [
        "void merge(int* a, int l, int m, int r) {",
        "    vector<int> left(a+l, a+m+1), right(a+m+1, a+r+1);",
        "    int i=0, j=0, k=l;",
        "    while (i<left.size() && j<right.size())",
        "        a[k++] = (left[i]<=right[j]) ? left[i++] : right[j++];",
        "    while (i<left.size())  a[k++] = left[i++];",
        "    while (j<right.size()) a[k++] = right[j++];",
        "}",
    ]),
    ("14.5 Quick Sort", [
        "Pick a pivot, partition array so elements < pivot are left, > pivot are right, recurse",
        "Time: O(n log n) average, O(n^2) worst (bad pivot choice — e.g., always smallest)",
        "Space: O(log n) stack space average",
        "In-place, cache-friendly — fastest in practice for most inputs",
        "Pivot strategies: last element (simple), median-of-three (better), random (avoids worst case)",
    ], [
        "int partition(int* a, int l, int r) {",
        "    int pivot = a[r], i = l-1;",
        "    for (int j = l; j < r; j++)",
        "        if (a[j] <= pivot) swap(a[++i], a[j]);",
        "    swap(a[i+1], a[r]);",
        "    return i+1;",
        "}",
        "",
        "void quickSort(int* a, int l, int r) {",
        "    if (l < r) {",
        "        int p = partition(a, l, r);",
        "        quickSort(a, l, p-1);",
        "        quickSort(a, p+1, r);",
        "    }",
        "}",
    ]),
]),

# ── 15 ────────────────────────────────────────────────────────────────────────
("Topic 15: Searching Algorithms and Complexity Summary", [
    ("15.1 Linear Search", [
        "Scan each element until target found or end reached",
        "Time: O(n) worst and average, O(1) best",
        "Works on unsorted arrays",
        "Sufficient for small arrays or one-time searches",
    ], [
        "int linearSearch(int* a, int n, int target) {",
        "    for (int i = 0; i < n; i++)",
        "        if (a[i] == target) return i;",
        "    return -1;",
        "}",
    ]),
    ("15.2 Binary Search", [
        "Requires sorted array — compare target with middle element",
        "If target < mid: search left half; if target > mid: search right half; else found",
        "Time: O(log n) — eliminates half the remaining elements each step",
        "Iterative version preferred (no stack overhead)",
    ], [
        "int binarySearch(int* a, int n, int target) {",
        "    int lo = 0, hi = n - 1;",
        "    while (lo <= hi) {",
        "        int mid = lo + (hi - lo) / 2;  // avoids overflow",
        "        if      (a[mid] == target) return mid;",
        "        else if (a[mid] <  target) lo = mid + 1;",
        "        else                       hi = mid - 1;",
        "    }",
        "    return -1;",
        "}",
    ]),
    ("15.3 Complexity Summary Table", [
        "Data Structure  | Access | Search | Insert | Delete",
        "Array           | O(1)   | O(n)   | O(n)   | O(n)",
        "Linked List     | O(n)   | O(n)   | O(1)*  | O(1)*",
        "Stack / Queue   | O(n)   | O(n)   | O(1)   | O(1)",
        "BST (balanced)  | O(log n) | O(log n) | O(log n) | O(log n)",
        "Hash Table      | N/A    | O(1)** | O(1)** | O(1)**",
        "Heap            | O(1)   | O(n)   | O(log n) | O(log n)",
        "  * at head with pointer  ** average case",
    ], None),
    ("15.4 Sorting Complexity Summary", [
        "Bubble Sort:    Best O(n), Average O(n^2), Worst O(n^2), Space O(1), Stable",
        "Selection Sort: Best O(n^2), Average O(n^2), Worst O(n^2), Space O(1), Not Stable",
        "Insertion Sort: Best O(n), Average O(n^2), Worst O(n^2), Space O(1), Stable",
        "Merge Sort:     Best O(n log n), Average O(n log n), Worst O(n log n), Space O(n), Stable",
        "Quick Sort:     Best O(n log n), Average O(n log n), Worst O(n^2), Space O(log n), Not Stable",
        "Heap Sort:      Best O(n log n), Average O(n log n), Worst O(n log n), Space O(1), Not Stable",
        "Lower bound for comparison-based sorting: O(n log n) — cannot do better",
    ], None),
    ("15.5 Choosing the Right Data Structure", [
        "Need fast random access? -> Array or vector",
        "Frequent insert/delete in the middle? -> Linked List",
        "LIFO behaviour? -> Stack",
        "FIFO behaviour? -> Queue",
        "Need sorted data with fast search? -> BST (balanced) or sorted vector + binary search",
        "Need fastest possible lookup, no order needed? -> Hash Table (unordered_map)",
        "Need to always access the min or max quickly? -> Heap / Priority Queue",
        "Represent relationships between entities? -> Graph",
    ], None),
]),

]  # end DS_TOPICS


# ── PDF rendering engine ─────────────────────────────────────────────────────

def render_topic(title, sections, out_path):
    pdf = CoursePDF(title)
    pdf.topic_banner()

    for sec_title, bullets, code_lines in sections:
        pdf.section(sec_title)
        for b in bullets:
            pdf.bullet(b)
        if code_lines:
            pdf.code(code_lines)

    pdf.divider()
    pdf.output(out_path)


def generate_course(topics, folder):
    os.makedirs(folder, exist_ok=True)
    for i, (title, sections) in enumerate(topics, start=1):
        short = title.replace("Topic " + str(i) + ": ", "")
        fname = f"Topic {i:02d}_{short}.pdf"
        out   = os.path.join(folder, fname)
        render_topic(title, sections, out)
        print(f"  Created: {fname}")


if __name__ == "__main__":
    base = r"D:\skill-sphere-Cpanel-main"

    print("Generating OOP course...")
    generate_course(OOP_TOPICS, os.path.join(base, "oop course"))

    print("Generating Data Structures course...")
    generate_course(DS_TOPICS, os.path.join(base, "data structures course"))

    print("Done.")
