# 🧪 Teste do Super Admin

## Verificar Super Admins Criados

Após iniciar a aplicação, você pode verificar se os super-admins foram criados corretamente:

### Método 1: Via Console do Navegador

1. Iniciar aplicação:
```bash
npm run dev
```

2. Abrir a aplicação no navegador: `http://localhost:5173`

3. Abrir o Console do Navegador (F12)

4. Executar o seguinte código:
```javascript
// Obter todos os usuários do localStorage
const users = JSON.parse(localStorage.getItem('auth_users') || '[]')

// Filtrar apenas super-admins
const superAdmins = users.filter(u => u.role === 'super-admin')

// Mostrar informações (sem senha)
console.table(superAdmins.map(u => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
  isActive: u.isActive,
  isApproved: u.isApproved,
  createdAt: u.createdAt
})))
```

**Resultado Esperado:**
```
┌─────────┬──────────────────┬──────────────────────────┬────────────────────┬──────────────┬──────────┬────────────┬─────────────────────────┐
│ (index) │       id         │          email           │      fullName      │     role     │ isActive │ isApproved │       createdAt        │
├─────────┼──────────────────┼──────────────────────────┼────────────────────┼──────────────┼──────────┼────────────┼─────────────────────────┤
│    0    │ 'user-xxxxxxxx'  │ 'admin@kidsaligner.com'  │  'Super Admin'     │'super-admin' │   true   │    true    │ '2025-12-08T...'       │
│    1    │ 'user-xxxxxxxx1' │ 'leomachadopt@gmail.com' │'Leonardo Machado'  │'super-admin' │   true   │    true    │ '2025-12-08T...'       │
└─────────┴──────────────────┴──────────────────────────┴────────────────────┴──────────────┴──────────┴────────────┴─────────────────────────┘
```

---

### Método 2: Testar Login Direto

#### Teste 1: Leonardo Machado
1. Acessar `http://localhost:5173`
2. Login:
   - **Email**: `leomachadopt@gmail.com`
   - **Senha**: `Admin123`
3. Clicar "Entrar"

**✅ Resultado Esperado:**
- Toast de sucesso: "Login realizado com sucesso!"
- Redireciona para `/dashboard`
- Nome exibido: "Leonardo Machado"
- Tem acesso a TODAS as rotas (inclusive `/admin/prompts`)

---

#### Teste 2: Admin Padrão
1. Fazer logout
2. Acessar `http://localhost:5173`
3. Login:
   - **Email**: `admin@kidsaligner.com`
   - **Senha**: `admin123`
4. Clicar "Entrar"

**✅ Resultado Esperado:**
- Toast de sucesso: "Login realizado com sucesso!"
- Redireciona para `/dashboard`
- Nome exibido: "Super Admin"
- Tem acesso a TODAS as rotas

---

### Método 3: Verificar no Network (DevTools)

1. Abrir DevTools (F12)
2. Ir para aba "Application" ou "Storage"
3. Expandir "Local Storage"
4. Clicar em `http://localhost:5173`
5. Procurar chave `auth_users`
6. Ver JSON com lista de usuários

**✅ Deve conter 2 super-admins:**
```json
[
  {
    "id": "user-...",
    "email": "admin@kidsaligner.com",
    "role": "super-admin",
    "fullName": "Super Admin",
    "password_hash": "$2a$10$...",
    "isActive": true,
    "isApproved": true,
    "emailVerified": true,
    ...
  },
  {
    "id": "user-...",
    "email": "leomachadopt@gmail.com",
    "role": "super-admin",
    "fullName": "Leonardo Machado",
    "password_hash": "$2a$10$...",
    "isActive": true,
    "isApproved": true,
    "emailVerified": true,
    ...
  }
]
```

---

## 🔧 Resetar Super Admins

Se precisar resetar os super-admins (apagar e recriar):

### Via Console do Navegador:
```javascript
// Apagar todos os usuários
localStorage.removeItem('auth_users')

// Apagar sessão atual
localStorage.removeItem('auth_session')

// Recarregar a página
location.reload()
```

Ao recarregar, os 2 super-admins serão recriados automaticamente.

---

## 📊 Informações dos Super Admins

### Leonardo Machado (Owner)
- **ID**: Gerado automaticamente
- **Email**: leomachadopt@gmail.com
- **Senha**: Admin123
- **Role**: super-admin
- **Nome Completo**: Leonardo Machado
- **Status**: Ativo e Aprovado
- **Permissões**: TODAS (acesso total ao sistema)

### Admin Padrão
- **ID**: Gerado automaticamente
- **Email**: admin@kidsaligner.com
- **Senha**: admin123
- **Role**: super-admin
- **Nome Completo**: Super Admin
- **Status**: Ativo e Aprovado
- **Permissões**: TODAS (acesso total ao sistema)

---

## ✅ Checklist de Verificação

- [ ] Executar `npm run dev`
- [ ] Abrir `http://localhost:5173`
- [ ] Abrir Console do Navegador (F12)
- [ ] Executar código de verificação
- [ ] Confirmar que 2 super-admins aparecem na tabela
- [ ] Testar login com `leomachadopt@gmail.com` / `Admin123`
- [ ] Verificar acesso a `/dashboard`
- [ ] Verificar acesso a `/admin/prompts`
- [ ] Fazer logout
- [ ] Testar login com `admin@kidsaligner.com` / `admin123`
- [ ] Confirmar acesso total

---

## 🎉 Status

✅ **2 Super Admins criados com sucesso!**

- ✅ Leonardo Machado (leomachadopt@gmail.com)
- ✅ Admin Padrão (admin@kidsaligner.com)

Ambos têm acesso completo ao sistema.
