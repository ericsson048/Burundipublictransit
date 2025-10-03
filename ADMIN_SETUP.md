# Configuration Administrateur

## Créer le premier administrateur

Pour créer le premier compte administrateur, suivez ces étapes:

### 1. Créer un compte utilisateur

Utilisez l'écran de connexion de l'application pour créer un nouveau compte avec votre email et mot de passe.

### 2. Ajouter l'utilisateur à la table admins

Connectez-vous à votre tableau de bord Supabase et exécutez cette requête SQL:

```sql
-- Remplacez 'votre-email@exemple.com' par l'email du compte créé
INSERT INTO admins (user_id, created_by)
SELECT id, id FROM auth.users
WHERE email = 'votre-email@exemple.com';
```

### 3. Vérifier l'accès admin

Déconnectez-vous et reconnectez-vous dans l'application. Vous devriez maintenant voir le bouton Admin sur l'écran d'accueil et avoir accès au panneau d'administration.

## Ajouter d'autres administrateurs

Une fois que vous êtes administrateur, vous pouvez ajouter d'autres administrateurs depuis la base de données Supabase en utilisant la même requête SQL ci-dessus.

## Fonctionnalités Admin

Les administrateurs ont accès à:
- Gestion des agences de transport
- Gestion des lignes de bus
- Modification des informations de contact
- Activation/désactivation des lignes et agences
