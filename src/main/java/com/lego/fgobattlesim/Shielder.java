package com.lego.fgobattlesim;

import java.util.ArrayList;

public class Shielder extends Servant {

    private String className = "Shielder";
    

    

    public Shielder(String name, int id, int rarity, int cost, int lvl_1_atk, int lvl_1_hp,
                    int max_atk, int max_hp, int grailAtk, int grailHp, int onetwentyAtk, int onetwentyHp, Attribute attribute, String GrowthCurve, int starAbsorption,
                    double starGeneration, double npChargeAtk, double npChargeDef, double deathRate,
                    Alignments_law law, Alignments_moral moral, String gender, ArrayList<String> traits,
                    ArrayList<String> deck, int quickHits, int artsHits, int busterHits, int extraHits,
                    CardTypes npCardType, String npRank, String npClassification, int npHits) {
        super(name, id, rarity, cost, lvl_1_atk, lvl_1_hp, max_atk, max_hp, grailAtk, grailHp, onetwentyAtk, onetwentyHp, attribute, GrowthCurve, starAbsorption,
              starGeneration, npChargeAtk, npChargeDef, deathRate, law, moral, gender, traits, deck, quickHits, artsHits,
              busterHits, extraHits, npCardType, npRank, npClassification, npHits);

        
        beastModAtk = 1;
        rulerModAtk = 1;
        berserkerModAtk = 1;
        baseDmgMod = 1.0;
        baseStarAbs = 100.0;
        baseStarGen = 0.10;
        baseDeathRate = 0.35;


        
    }

    public String getClassName() {
        return className;
    }
    
}


