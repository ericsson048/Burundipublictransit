/*
  # Création du système de transport pour le Burundi

  ## Tables créées
  
  ### 1. cities (Villes)
    - `id` (uuid, primary key)
    - `name` (text) - Nom de la ville (Bujumbura, Ngozi, etc.)
    - `coordinates` (jsonb) - Coordonnées GPS {lat, lng}
    - `created_at` (timestamptz)

  ### 2. bus_lines (Lignes de bus urbains)
    - `id` (uuid, primary key)
    - `name` (text) - Nom de la ligne (ex: "Ligne 1: Centre-ville → Gasenyi")
    - `city_id` (uuid) - Référence à la ville
    - `zones_covered` (text[]) - Zones traversées
    - `route_coordinates` (jsonb) - Tracé GPS de la ligne
    - `stops` (jsonb) - Liste des arrêts avec coordonnées
    - `color` (text) - Couleur pour la carte
    - `active` (boolean) - Ligne active ou non
    - `created_at` (timestamptz)

  ### 3. transport_agencies (Agences de transport interprovincial)
    - `id` (uuid, primary key)
    - `name` (text) - Nom de l'agence (Volcano, Atraco, etc.)
    - `contact_phone` (text)
    - `contact_email` (text)
    - `logo_url` (text)
    - `active` (boolean)
    - `created_at` (timestamptz)

  ### 4. intercity_routes (Trajets interprovinciaux)
    - `id` (uuid, primary key)
    - `agency_id` (uuid) - Référence à l'agence
    - `departure_city_id` (uuid) - Ville de départ
    - `arrival_city_id` (uuid) - Ville d'arrivée
    - `route_coordinates` (jsonb) - Tracé GPS principal
    - `departure_point` (text) - Point de départ exact
    - `arrival_point` (text) - Point d'arrivée exact
    - `frequency` (text) - Fréquence (ex: "Tous les jours")
    - `duration_minutes` (integer) - Durée estimée
    - `price` (integer) - Prix en FBU
    - `schedule` (jsonb) - Horaires de départ
    - `active` (boolean)
    - `created_at` (timestamptz)

  ## Sécurité
    - RLS activé sur toutes les tables
    - Lecture publique pour tous (transport public)
    - Modifications réservées aux administrateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coordinates jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bus_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  zones_covered text[] DEFAULT '{}',
  route_coordinates jsonb NOT NULL,
  stops jsonb DEFAULT '[]',
  color text DEFAULT '#3B82F6',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transport_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_phone text,
  contact_email text,
  logo_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intercity_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES transport_agencies(id) ON DELETE CASCADE,
  departure_city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  arrival_city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  route_coordinates jsonb NOT NULL,
  departure_point text NOT NULL,
  arrival_point text NOT NULL,
  frequency text DEFAULT 'Tous les jours',
  duration_minutes integer,
  price integer,
  schedule jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bus_lines_city ON bus_lines(city_id);
CREATE INDEX IF NOT EXISTS idx_bus_lines_active ON bus_lines(active);
CREATE INDEX IF NOT EXISTS idx_intercity_routes_agency ON intercity_routes(agency_id);
CREATE INDEX IF NOT EXISTS idx_intercity_routes_cities ON intercity_routes(departure_city_id, arrival_city_id);
CREATE INDEX IF NOT EXISTS idx_intercity_routes_active ON intercity_routes(active);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercity_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cities"
  ON cities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can read bus lines"
  ON bus_lines FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can read agencies"
  ON transport_agencies FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Public can read intercity routes"
  ON intercity_routes FOR SELECT
  TO public
  USING (active = true);
