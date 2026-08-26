const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace onIonChange with onIonInput for all IonInput elements.
  // We'll use a regex that matches <IonInput ... onIonChange={...}
  // Because Profile.tsx has it on multiple lines, we need to be careful.
  
  if (['Login.tsx', 'Register.tsx', 'Profile.tsx', 'ResetPassword.tsx', 'ForgotPassword.tsx'].includes(file)) {
      // Safe to replace all
      content = content.replace(/onIonChange/g, 'onIonInput');
  } else {
      // For Budgets, Categories, Accounts
      // Replace onIonChange with onIonInput ONLY if the line contains IonInput
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('<IonInput') && lines[i].includes('onIonChange')) {
              lines[i] = lines[i].replace('onIonChange', 'onIonInput');
          }
      }
      content = lines.join('\n');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});
