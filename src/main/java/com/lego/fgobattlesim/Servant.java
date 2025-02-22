package com.lego.fgobattlesim;

import java.util.ArrayList;

abstract class Servant {

    protected String name;
    protected int id;
    protected int rarity;
    protected String servClass;
    protected int cost;
    protected int lvl_1_atk;
    protected int lvl_1_hp;
    protected int max_atk;
    protected int max_hp;
    protected int grailAtk;
    protected int grailHp;
    protected int onetwentyAtk;
    protected int onetwentyHp;
    protected Attribute attribute;
    protected String GrowthCurve;
    protected int starAbsorption;
    protected double starGeneration;
    protected double npChargeAtk;
    protected double npChargeDef;
    protected double deathRate;
    protected Alignments_law law;
    protected Alignments_moral moral;
    protected String gender;
    protected ArrayList<String> traits;
    protected ArrayList<String> deck;
    protected int quickHits;
    protected int artsHits;
    protected int busterHits;
    protected int extraHits;
    protected CardTypes npCardType;
    protected String npRank;
    protected String npClassification;
    protected int npHits; 

    //bases
    protected double baseDmgMod;
    protected double baseStarAbs;
    protected double baseStarGen;
    protected double baseDeathRate;

    //for type adv defaults
    protected double archerModAtk = 1.0;
    protected double saberModAtk = 1.0;
    protected double lancerModAtk = 1.0;
    protected double riderModAtk = 1.0;
    protected double casterModAtk = 1.0;
    protected double assassinModAtk = 1.0;
    protected double berserkerModAtk = 2.0;
    protected double rulerModAtk = 0.5;
    protected double avengerModAtk = 1.0;
    protected double mooncancerModAtk = 1.0;
    protected double alteregoModAtk = 1.0;
    protected double foreignerModAtk = 1.0;
    protected double beastModAtk = 1.0;
    protected double shielderModAtk = 1.0;
    protected double pretenderModAtk = 1.0;




    
    public Servant(String name, int id, int rarity, int cost, int lvl_1_atk, int lvl_1_hp,
                   int max_atk, int max_hp, int grailAtk, int grailHp, int onetwentyAtk, int onetwentyHp, Attribute attribute, String GrowthCurve, int starAbsorption,
                   double starGeneration, double npChargeAtk, double npChargeDef, double deathRate,
                   Alignments_law law, Alignments_moral moral, String gender, ArrayList<String> traits,
                   ArrayList<String> deck, int quickHits, int artsHits, int busterHits, int extraHits,
                   CardTypes npCardType, String npRank, String npClassification, int npHits) {

        this.name = name;
        this.id = id;
        this.rarity = rarity;
        this.cost = cost;
        this.lvl_1_atk = lvl_1_atk;
        this.lvl_1_hp = lvl_1_hp;
        this.max_atk = max_atk;
        this.max_hp = max_hp;
        this.grailAtk = grailAtk;
        this.grailHp = grailHp;
        this.onetwentyAtk = onetwentyAtk;
        this.onetwentyHp = onetwentyHp;
        this.attribute = attribute;
        this.GrowthCurve = GrowthCurve;
        this.starAbsorption = starAbsorption;
        this.starGeneration = starGeneration;
        this.npChargeAtk = npChargeAtk;
        this.npChargeDef = npChargeDef;
        this.deathRate = deathRate;
        this.law = law;
        this.moral = moral;
        this.gender = gender;
        this.traits = traits;
        this.deck = deck;
        this.quickHits = quickHits;
        this.artsHits = artsHits;
        this.busterHits = busterHits;
        this.extraHits = extraHits;
        this.npCardType = npCardType;
        this.npRank = npRank;
        this.npClassification = npClassification;
        this.npHits = npHits;
    }

    public String getName() {
        return name;
    }

    public int getId() {
        return id;
    }

    public int getRarity() {
        return rarity;
    }

    public int getCost() {
        return cost;
    }

    public int getLvl_1_atk() {
        return lvl_1_atk;
    }

    public int getLvl_1_hp() {
        return lvl_1_hp;
    }

    public int getMax_atk() {
        return max_atk;
    }

    public int getMax_hp() {
        return max_hp;
    }

    public Attribute getAttribute() {
        return attribute;
    }

    public String getGrowthCurve() {
        return GrowthCurve;
    }

    public int getStarAbsorption() {
        return starAbsorption;
    }

    public double getStarGeneration() {
        return starGeneration;
    }

    public double getNpChargeAtk() {
        return npChargeAtk;
    }

    public double getNpChargeDef() {
        return npChargeDef;
    }

    public double getDeathRate() {
        return deathRate;
    }

    public Alignments_law getLaw() {
        return law;
    }

    public Alignments_moral getMoral() {
        return moral;
    }

    public String getGender() {
        return gender;
    }

    public ArrayList<String> getTraits() {
        return traits;
    }

    public ArrayList<String> getDeck() {
        return deck;
    }

    public int getQuickHits() {
        return quickHits;
    }

    public int getArtsHits() {
        return artsHits;
    }

    public int getBusterHits() {
        return busterHits;
    }

    public int getExtraHits() {
        return extraHits;
    }

    public CardTypes getNpCardType() {
        return npCardType;
    }

    public String getNpRank() {
        return npRank;
    }

    public String getNpClassification() {
        return npClassification;
    }

    public int getNpHits() {
        return npHits;
    }

    public int getGrailAtk() {
        return grailAtk;
    }

    public int getGrailHp() {
        return grailHp;
    }

    public int getOnetwentyAtk() {
        return onetwentyAtk;
    }

    public int getOnetwentyHp() {
        return onetwentyHp;
    }

    public String toString() {
        return name;
    }


}
