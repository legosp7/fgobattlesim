package com.lego.fgobattlesim;

//simple FGO damage calc
//TO DO: Add RESTful web so you can give id and get a servant back

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Scanner;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FgobattlesimApplication {

	private static ArrayList<Saber> sabers = new ArrayList<Saber>();
	private static ArrayList<Archer> archers = new ArrayList<Archer>();
	private static ArrayList<Lancer> lancers = new ArrayList<Lancer>();
	private static ArrayList<Rider> riders = new ArrayList<Rider>();
	private static ArrayList<Caster> casters = new ArrayList<Caster>();
	private static ArrayList<Assassin> assassins = new ArrayList<Assassin>();
	private static ArrayList<Berserker> berserkers = new ArrayList<Berserker>();
	private static ArrayList<Ruler> rulers = new ArrayList<Ruler>();
	private static ArrayList<Avenger> avengers = new ArrayList<Avenger>();
	private static ArrayList<MoonCancer> mooncancers = new ArrayList<MoonCancer>();
	private static ArrayList<AlterEgo> alteregos = new ArrayList<AlterEgo>();
	private static ArrayList<Foreigner> foreigners = new ArrayList<Foreigner>();
	private static ArrayList<Beast> beasts = new ArrayList<Beast>();
	private static ArrayList<Shielder> shielders = new ArrayList<Shielder>();
	private static ArrayList<Pretender> pretenders = new ArrayList<Pretender>();
	private static HashMap<Integer, Servant> allServants = new HashMap<>();

	public static void main(String[] args) {
		loadServants("servantdata.csv");
		SpringApplication.run(FgobattlesimApplication.class, args);
	}

	public static void loadServants(String filename) {
		// Servant servant = new Servant();
		// servant.loadServants();
		Iterable<CSVRecord> records = null;
		String[] HEADERS = {"Servant Name", "ID", "Rarity", "Class", "Japanese Name", "AKA", "Cost", "ATK at level 1", "ATK at max Servant level", "HP at level 1", "HP at max Servant level", "Lvl 100 Grail ATK", "Lvl 100 Grail HP", "Lvl 120 Grail ATK", "Lvl 120 Grail HP", "Voice Actor", "Illustrator", "Attribute", "Growth Curve", "Star Absorption", "Star Generation", "NP Charge ATK", "NP Charge DEF", "Death Rate", "Alignments", "Gender", "Traits", "Card Order", "Quick Hits", "Arts Hits", "Buster Hits", "Extra Hits", "NP Damage Type", "NP Rank", "NP Classification", "NP Hit-Count"};
		try {		
			FileReader in = new FileReader(filename);
			CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
			.setHeader(HEADERS)
			.setSkipHeaderRecord(true)
			.build();

			try {
				records = csvFormat.parse(in);
			} catch (Exception e) {
				System.out.println("Error parsing CSV");
			}

			for (CSVRecord record : records) {
				//split
				String name = record.get("Servant Name");
				int id = Integer.parseInt(record.get("ID"));
				int rarity = Integer.parseInt(record.get("Rarity").split("-")[0]);
				String servClass = record.get("Class");
				int cost = Integer.parseInt(record.get("Cost"));
				int lvl_1_atk = Integer.parseInt(record.get("ATK at level 1"));
				int max_atk = Integer.parseInt(record.get("ATK at max Servant level"));
				int lvl_1_hp = Integer.parseInt(record.get("HP at level 1"));
				int max_hp = Integer.parseInt(record.get("HP at max Servant level"));
				int grailAtk = Integer.parseInt(record.get("Lvl 100 Grail ATK"));
				int grailHp = Integer.parseInt(record.get("Lvl 100 Grail HP"));
				int onetwentyAtk = Integer.parseInt(record.get("Lvl 120 Grail ATK"));
				int onetwentyHp = Integer.parseInt(record.get("Lvl 120 Grail HP"));
				
				Attribute attribute = Attribute.valueOf(record.get("Attribute").toUpperCase());
				String GrowthCurve = record.get("Growth Curve");
				int starAbsorption;
				//have to handle jenkyl and hyde 
				try {
					starAbsorption = (int) Double.parseDouble(record.get("Star Absorption"));
				} catch (NumberFormatException e) {
					starAbsorption = (int) Double.parseDouble(record.get("Star Absorption").split("/")[0].trim());
				}
				double starGeneration;
				try {
					starGeneration = Double.parseDouble(record.get("Star Generation"));
				} catch (NumberFormatException e) {
					starGeneration = Double.parseDouble(record.get("Star Generation").split("/")[0].trim().replace("%", ""));
				}
				double npChargeAtk;
				try {
					npChargeAtk = Double.parseDouble(record.get("NP Charge ATK"));
				} catch (NumberFormatException e) {
					npChargeAtk = Double.parseDouble(record.get("NP Charge ATK").split("/")[0].trim().replace("%", ""));
				}
				double npChargeDef;
				try {
					npChargeDef = Double.parseDouble(record.get("NP Charge DEF"));
				} catch (NumberFormatException e) {
					npChargeDef = Double.parseDouble(record.get("NP Charge DEF").split("/")[0].trim().replace("%", ""));
				}
				double deathRate;
				try {
					deathRate = Double.parseDouble(record.get("Death Rate"));
				} catch (NumberFormatException e) {
					deathRate = Double.parseDouble(record.get("Death Rate").split("/")[0].trim().replace("%", ""));
				}
				String[] alignments = record.get("Alignments").split(" ");
				Alignments_law law = Alignments_law.valueOf(alignments[0].toUpperCase());
				Alignments_moral moral;
				if (alignments.length > 2) {
					moral = Alignments_moral.valueOf("GOODBAD");
				} else {
					moral = Alignments_moral.valueOf(alignments[1].toUpperCase());
				}
				String gender = record.get("Gender");
				ArrayList<String> traits = new ArrayList<String>();
				for (String trait : record.get("Traits").split(", ")) {
					traits.add(trait);
				}
				ArrayList<String> deck = new ArrayList<String>();
				for (String card : record.get("Card Order").split("")) {
					deck.add(card);
				}
				int quickHits = Integer.parseInt(record.get("Quick Hits"));
				int artsHits = Integer.parseInt(record.get("Arts Hits"));
				int busterHits = Integer.parseInt(record.get("Buster Hits"));
				int extraHits = (int) Double.parseDouble(record.get("Extra Hits"));
				CardTypes npCardType = CardTypes.valueOf(record.get("NP Damage Type").toUpperCase());
				String npRank = record.get("NP Rank");
				String npClassification = record.get("NP Classification");
				String npHits = record.get("NP Hit-Count");
				int npHitsInt;
				try {
					npHitsInt = (int) Double.parseDouble(npHits);
				} catch (NumberFormatException e) {
					if (npHits.equals("－") || npHits.equals("None")) {
						npHitsInt = 0;
					} else {
						npHitsInt = Character.valueOf(npHits.charAt(0));
					}
				}
				//now we can put them in their respective classes
				switch (servClass) {
					case "Saber":
						Saber saber = new Saber(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						sabers.add(saber);
						allServants.put(id, saber);
						break;
					case "Archer":
						Archer archer = new Archer(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						archers.add(archer);
						allServants.put(id, archer);

						break;
					case "Lancer":
						Lancer lancer = new Lancer(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						lancers.add(lancer);
						allServants.put(id, lancer);
						break;
					case "Rider":
						Rider rider = new Rider(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						riders.add(rider);
						allServants.put(id, rider);
						break;
					case "Caster":
						Caster caster = new Caster(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						casters.add(caster);
						allServants.put(id, caster);
						break;
					case "Assassin":
						Assassin assassin = new Assassin(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						assassins.add(assassin);
						allServants.put(id, assassin);
						break;
					case "Berserker":
						Berserker berserker = new Berserker(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						berserkers.add(berserker);
						allServants.put(id, berserker);
						break;
					case "Ruler":
						Ruler ruler = new Ruler(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						rulers.add(ruler);
						allServants.put(id, ruler);
						break;
					case "Avenger":
						Avenger avenger = new Avenger(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						avengers.add(avenger);
						allServants.put(id, avenger);
						break;
					case "Moon Cancer":
						MoonCancer mooncancer = new MoonCancer(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						mooncancers.add(mooncancer);
						allServants.put(id, mooncancer);
						break;
					case "Alter Ego":
						AlterEgo alterego = new AlterEgo(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						alteregos.add(alterego);
						allServants.put(id, alterego);
						break;
					case "Foreigner":
						Foreigner foreigner = new Foreigner(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						foreigners.add(foreigner);
						allServants.put(id, foreigner);
						break;
					case "Beast":
						Beast beast = new Beast(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						beasts.add(beast);
						allServants.put(id, beast);
						break;
					case "Shielder":
						Shielder shielder = new Shielder(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						shielders.add(shielder);
						allServants.put(id, shielder);
						break;
					case "Pretender":
						Pretender pretender = new Pretender(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption, starGeneration, npChargeAtk, npChargeDef, deathRate, law,
								moral, gender, traits, deck, quickHits, artsHits, busterHits, extraHits, npCardType, npRank, npClassification, npHitsInt);
						pretenders.add(pretender);
						allServants.put(id, pretender);
						break;
				}	




			}
		} catch (FileNotFoundException e) {
			System.out.println("File not found");
		}
	}



}
