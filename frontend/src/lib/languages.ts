export interface Language {
  id: string
  label: string
  extension: string
  defaultCode: string
  monacoId: string
}

export const LANGUAGES: Language[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    monacoId: 'javascript',
    defaultCode: `// JavaScript\nconsole.log("Hello, CodeMentor!");\n`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    extension: 'ts',
    monacoId: 'typescript',
    defaultCode: `// TypeScript\nconst greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet("CodeMentor"));\n`,
  },
  {
    id: 'python',
    label: 'Python',
    extension: 'py',
    monacoId: 'python',
    defaultCode: `# Python\nprint("Hello, CodeMentor!")\n`,
  },
  {
    id: 'java',
    label: 'Java',
    extension: 'java',
    monacoId: 'java',
    defaultCode: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeMentor!");\n    }\n}\n`,
  },
  {
    id: 'cpp',
    label: 'C++',
    extension: 'cpp',
    monacoId: 'cpp',
    defaultCode: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeMentor!" << endl;\n    return 0;\n}\n`,
  },
  {
    id: 'c',
    label: 'C',
    extension: 'c',
    monacoId: 'c',
    defaultCode: `// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeMentor!\\n");\n    return 0;\n}\n`,
  },
  {
    id: 'csharp',
    label: 'C#',
    extension: 'cs',
    monacoId: 'csharp',
    defaultCode: `// C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, CodeMentor!");\n    }\n}\n`,
  },
  {
    id: 'go',
    label: 'Go',
    extension: 'go',
    monacoId: 'go',
    defaultCode: `// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeMentor!")\n}\n`,
  },
  {
    id: 'rust',
    label: 'Rust',
    extension: 'rs',
    monacoId: 'rust',
    defaultCode: `// Rust\nfn main() {\n    println!("Hello, CodeMentor!");\n}\n`,
  },
  {
    id: 'php',
    label: 'PHP',
    extension: 'php',
    monacoId: 'php',
    defaultCode: `<?php\n// PHP\necho "Hello, CodeMentor!\\n";\n`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    extension: 'rb',
    monacoId: 'ruby',
    defaultCode: `# Ruby\nputs "Hello, CodeMentor!"\n`,
  },
  {
    id: 'html',
    label: 'HTML',
    extension: 'html',
    monacoId: 'html',
    defaultCode: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>Hello</title>\n  </head>\n  <body>\n    <h1>Hello, CodeMentor!</h1>\n  </body>\n</html>\n`,
  },
  {
    id: 'css',
    label: 'CSS',
    extension: 'css',
    monacoId: 'css',
    defaultCode: `/* CSS */\nbody {\n  background: #0a0a0a;\n  color: #fff;\n}\n`,
  },
  {
    id: 'sql',
    label: 'SQL',
    extension: 'sql',
    monacoId: 'sql',
    defaultCode: `-- SQL\nSELECT * FROM users;\n`,
  },
]

export function getLanguage(id: string): Language {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0]
}